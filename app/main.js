$(function() {
  // This function runs when the page loads and initializes the chat

  const $window = $(window);
  const $usernameInput = $('.usernameInput'); 
  const $messages = $('.messages');          
  const $inputMessage = $('.inputMessage'); 

  const $loginPage = $('.login.page');  
  const $chatPage = $('.chat.page');     

  const socket = io(); // Connect to the WebSocket server

  let username; // Variable to store the username
  let connected = false; // Variable to track connection status
  let $currentInput = $usernameInput.focus(); // Variable to store the current input

  // Function to add a message about the number of participants
  const addParticipantsMessage = (data) => {
    let message = '';
    if (data.numOfUsers === 1) {
      message += `There is 1 participant`;
    } else {
      message += `There are ${data.numOfUsers} participants`;
    }
    log(message);
  }

  // Function to set the username
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());

    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      socket.emit('add user', username); // Send the username to the server
    }
  }

  // Function to send a message in the chat
  const sendMessage = () => {
    let message = $inputMessage.val();
    message = cleanInput(message);
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({ username, message }, {
        isYou: true
      });
      socket.emit('new message', message); // Send the new message to the server
    }
  }

  // Function to display a message in the chat
  const log = (message, options) => {
    const $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Function to add a chat message to the list
  const addChatMessage = (data, options = {}) => {
    let $usernameDiv = '';
    if (options.isYou) {
      $usernameDiv = $('<span class="username"/>')
      .text('You:')
      .css('color', '#5000FF');
    } else{
      $usernameDiv = $('<span class="username"/>')
      .text(data.username + ':')
      .css('color', '#E4A419');
    }
    const $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message)
      .css('color', '#ffffff');

    const $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Function to add a message element to the chat
  const addMessageElement = (el, options) => {
    const $el = $(el);
    if (!options) {
      options = {};
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }

    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Function to clean the entered text
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  // Keyboard events
  $window.keydown(event => {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    if (event.which === 13) {
      if (username) {
        sendMessage();
      } else {
        setUsername();
      }
    }
  });

  // Click event
  $loginPage.click(() => {
    $currentInput.focus();
  });

  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  // Socket events

  socket.on('login', (data) => {
    connected = true;
    const message = 'Welcome to the chat ';
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('new message', (data) => {
    addChatMessage(data, {
      isYou: false
    });
  });

  socket.on('user joined', (data) => {
    log(`${data.username} joined`);
    addParticipantsMessage(data);
  });

  socket.on('user left', (data) => {
    log(`${data.username} left`);
    addParticipantsMessage(data);
  });

  socket.on('disconnect', () => {
    log('You have been disconnected. Reconnecting...');
  });

  socket.io.on('reconnect', () => {
    log('You have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.io.on('reconnect_error', () => {
    log('Attempt to reconnect has failed. Reconnecting...');
  });

});