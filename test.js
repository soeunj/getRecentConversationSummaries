/*
* Implement a function that returns the summary of the current user's latest conversations,
* sorted by the latest message's timestamp (most recent conversation first).
*
* Make sure to have good unit tests in addition to the provided integration test!
*
* You have the following REST API available (base URL provided as a constant):
*
* Get current user's conversations: GET /conversations
* Get messages in a conversation: GET /conversations/:conversation_id/messages
* Get user by ID: GET /users/:user_id
*
* The result should be an array of objects of the following shape/type:
* {
*   id : string;
*   latest_message: {
*     body : string;
*     from_user : {
*       id: string;
*       avatar_url: string;
*     };
*     created_at : ISOString;
*   };
* }
*
*/
const API_BASE_URL = "http://ui-developer-backend.herokuapp.com/api";
const assert = require('assert');
const chai = require('chai');
const fetch = require("node-fetch");

async function getConversations (conversation_url) {
  try {
    var getRequest = await fetch(API_BASE_URL + conversation_url);
    conversations = await getRequest.json();
    return conversations;
  } catch (error) {
    return new Error("FetchError");
  }
}

async function getUsers (user_url) {
  try {
    var getRequest = await fetch(API_BASE_URL + user_url);
    users = await getRequest.json();
    return users;
  } catch (error) {
    return new Error("FetchError");
  }
}

async function getMessages (message_url) {
  try {
    var getRequest = await fetch(API_BASE_URL + message_url);
    messages = await getRequest.json();
    // sort messages by timestamp
    messages.sort(function(a, b) {
      var dateA = new Date(a.created_at), dateB = new Date(b.created_at);
      return dateB - dateA;
    });
    return messages[0]; // return latest one
  } catch (error) {
    return new Error("FetchError");
  }
}

function formatJson (conversation_id, message, avatarUrl) {
  return {
    id: conversation_id, 
    latest_message: {
      id: message.id, 
      body: message.body, 
      from_user: {
        id: message.from_user_id, 
        avatar_url: avatarUrl
      },
      created_at: message.created_at
    }
  };
}

function sortConversationSummaries (recentConversationSummaries) {
  recentConversationSummaries.sort(function(a, b) {
    var dateA = new Date(a.latest_message.created_at), dateB = new Date(b.latest_message.created_at);
    return dateB - dateA;
  });
}

async function getRecentConversationSummaries () {
  // fetch conversation and user data
  const conversations = await getConversations('/conversations');
  const users= await getUsers('/users');
  const conversationsLength = conversations.length, usersLength = users.length;

  var recentConversationSummaries = []; // summary object for return
  // create map { user id : avatar url } for summary
  var mapForUserIdAndAvatarURL = new Map();
  for (let i = 0; i<usersLength; i++) {
    mapForUserIdAndAvatarURL.set(users[i].id, users[i].avatar_url);
  }

  for (let i = 0; i< conversationsLength; i++) {
    // fetch messages for each conversation
    const messages = await getMessages('/conversations/' + conversations[i].id + '/messages');
    let avatarUrl = mapForUserIdAndAvatarURL.get(messages.from_user_id);  
    // add formatted data to recentConversationSummaries
    recentConversationSummaries[i] = formatJson(conversations[i].id, messages, avatarUrl);
  }
  // sort summary by latest message's timestamp
  sortConversationSummaries(recentConversationSummaries);

  return recentConversationSummaries;
}

const expect = chai.expect;

describe('getRecentConversationSummaries()', () => {
	it('should return the current user\'s latest conversations sorted by latest message\'s timestamp', async () => {
    // setup
    const expectedResult = [
      {
        id: "1",
        latest_message: {
          id: "1",
          body: "Moi!",
          from_user: {
            id: "1",
            avatar_url: "http://placekitten.com/g/300/300",
          },
          created_at: "2016-08-25T10:15:00.670Z",
        },
      },
      {
        id: "2",
        latest_message: {
          id: "2",
          body: "Hello!",
          from_user: {
            id: "3",
            avatar_url: "http://placekitten.com/g/302/302",
          },
          created_at: "2016-08-24T10:15:00.670Z",
        },
      },
      {
        id: "3",
        latest_message: {
          id: "3",
          body: "Hi!",
          from_user: {
            id: "1",
            avatar_url: "http://placekitten.com/g/300/300",
          },
          created_at: "2016-08-23T10:15:00.670Z",
        },
      },
      {
        id: "4",
        latest_message: {
          id: "4",
          body: "Morning!",
          from_user: {
            id: "5",
            avatar_url: "http://placekitten.com/g/304/304",
          },
          created_at: "2016-08-22T10:15:00.670Z",
        },
      },
      {
        id: "5",
        latest_message: {
          id: "5",
          body: "Pleep!",
          from_user: {
            id: "6",
            avatar_url: "http://placekitten.com/g/305/305",
          },
          created_at: "2016-08-21T10:15:00.670Z",
        },
      },
    ];
    // exercise
    const result = await getRecentConversationSummaries();
    // verify
    assert.deepEqual(result, expectedResult);
  });
  it('should return error if getConversations has error', async () => {
    // setup
    const inputURL = '/conversationss';
    // exercise
    const result = await getConversations(inputURL);
    // verify
    expect(result).to.be.an('error');
  });
  it('should return error if getUsers has error', async () => {
    // setup
    const inputURL = '/userss';
    // exercise
    const result = await getUsers(inputURL);
    // verify
    expect(result).to.be.an('error');
  });
  it('should return error if getMessages has error', async () => {
    // setup
    const inputURL = '/conversations/1/messagess';
    // exercise
    const result = await getMessages(inputURL);
    // verify
    expect(result).to.be.an('error');
  });
  it('should return correct format json', function() {
    // setup
    const expectedResult = {
      id: "1",
      latest_message: {
        id: "1",
        body: "Moi!",
        from_user: {
          id: "1",
          avatar_url: "http://placekitten.com/g/300/300",
        },
        created_at: "2016-08-25T10:15:00.670Z",
      },
    };
    const inputConversationId = 1;
    const inputMessage = {
      id: "1", 
      conversation_id: "1", 
      body: "Moi!", 
      from_user_id: "1", 
      created_at: "2016-08-25T10:15:00.670Z"
    };
    const inputAvatarURL = "http://placekitten.com/g/300/300";
    // exercise
    const result = formatJson(inputConversationId, inputMessage, inputAvatarURL);
    // verify
    assert.deepEqual(result, expectedResult);
  });
  it('should return sorted conversation summaries', function() {
    // setup
    const expectedResult = [
      {
        id: "1",
        latest_message: {
          id: "1",
          body: "Moi!",
          from_user: {
            id: "1",
            avatar_url: "http://placekitten.com/g/300/300",
          },
          created_at: "2016-08-25T10:15:00.670Z",
        },
      },
      {
        id: "2",
        latest_message: {
          id: "2",
          body: "Hello!",
          from_user: {
            id: "3",
            avatar_url: "http://placekitten.com/g/302/302",
          },
          created_at: "2016-08-24T10:15:00.670Z",
        },
      }];
    const inputJson = [
      {
        id: "2",
        latest_message: {
          id: "2",
          body: "Hello!",
          from_user: {
            id: "3",
            avatar_url: "http://placekitten.com/g/302/302",
          },
          created_at: "2016-08-24T10:15:00.670Z",
        },
      },
      {
        id: "1",
        latest_message: {
          id: "1",
          body: "Moi!",
          from_user: {
            id: "1",
            avatar_url: "http://placekitten.com/g/300/300",
          },
          created_at: "2016-08-25T10:15:00.670Z",
        },
      }];
    // exercise
    sortConversationSummaries(inputJson);
    // verify
    assert.deepEqual(inputJson, expectedResult);
  });
});




