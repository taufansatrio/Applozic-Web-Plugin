####  Send message

Send message from logged in user to another user
 ```
$applozic.fn.applozic('sendMessage', {
                                      "to": otherUserId,            //userId of the receiver
                                      "message" : messageText       //message to send           
                                    });
 ```

Response contains message key.



Send message visible only to the receiver.
 ```
$applozic.fn.applozic('sendMessage', {
                                      "to": otherUserId,            //userId of the receiver
                                      "message" : messageText,       //message to send    
                                      "type" : 12
                                    }); 
```

####  Get User Details


```
  $applozic.fn.applozic('getUserDetail', {callback: function getUserDetail(response) {
        if(response.status === 'success') {
           // write your logic
        }
     }
  });
```

Sample response:

```
           {'status' : 'success' ,                     // or error
            'data':  {'totalUnreadCount': 15           // total unread count for user          
                     'users':                          // Array of other users detail
                        [{"userId":"USERID_1","connected":false,"lastSeenAtTime":1453462368000,"createdAtTime":1452150981000,"unreadCount":3}, 
                        {"userId":"USERID_2","connected":false,"lastSeenAtTime":1452236884000,"createdAtTime":1452236884000,"unreadCount":1}]    
                     }
           }
```


#### Events subscription

Using events callback, you can subscribe to the following events.

```
$applozic.fn.applozic('subscribeToEvents', {
                 onConnect: function () {
                       //User subscribed successfully
                 },
                 onConnectFailed: function () {
                       //connection failed
                 },
                 onMessageDelivered: function (obj) {
                       //message delivered obj json: {'messageKey': 'delivered-message-key'}
                 },
                 onMessageRead: function (obj) {
                       //message read obj json: {'messageKey': 'read-message-key'}
                 },
                 onMessageReceived: function (obj) {
                       //message received
                 },
                 onMessageSentUpdate: function (obj) {
                       //message sent confirmation: {'messageKey': 'sent-message-key'}
                 },
                 onUserConnect: function (obj) {
                       //user from the contact list came online: {'userID': 'connected-user-Id'}
                 },
                 onUserDisconnect: function (obj) {
                       //user from the contact list went offline: {'userID': 'connected-user-Id'}
                 },
                 onUserBlocked: function (obj) {
                       //user blocks someone or gets blocked by someone: {'status': 'BLOCKED_TO or BLOCKED_BY', 'userId': userId}
                 },
                 onUserUnblocked': function (obj) {
                       //user unblocks someone or get unblocked by someone: {'status': 'BLOCKED_TO or BLOCKED_BY', 'userId': userId}
                 },
                 onUserActivated: function () {
                       //user is activated by app admin
                 },
                 onUserDeactivated: function () {
                       //user is deactivated by app admin
                 }
               });
```



 
#### Get Messages list     

```
  $applozic.fn.applozic('messageList', {'id': 'Group Id or User Id',     
                                        'isGroup': false,               // True in case of group 
                                        'clientGroupId' : 'CLIENT_GROUP_ID', // use either groupId or clientGroupId
                                        'callback': function(response){ // write your logic} 
                                        });
```        

 
Sample response:           

 ```
 response = {'status' : 'success',                     // or error
             'messages' :[{'key': "MESSAGE_IDENTIFIER",
                          'from': "SENDER_USERID",         
                          'to': 'RECEIVER_USERID',
                          'message': "MESSAGE_TEXT",
                          'type': 'inbox or outbox',
                          'status': "MESSAGE__CURRENT_STATUS",        // For outbox message  (sent, delivered or read)
                                                                    // For inbox messsage (read, unread)
                          'timeStamp': 'MESSAGE_CREATED_TIMESTAMP'          
                         }]                
           }
```         

 
 

### Light weight plugin with your own UI 

#### Add following scripts before ```</head>``` tag

```
<script type="text/javascript" src="https://www.applozic.com/resources/lib/js/mck-socket.min.js"></script>      
<script type="text/javascript" src="https://www.applozic.com/resources/sidebox/js/app/apz-client-1.0.js"></script>
```

#### Initialize Plugin

Create APPLOZIC instance by configuring your options

```

 var applozic = new APPLOZIC({'baseUrl': "https://apps.applozic.com",
                              'userId': 'PUT_USERID_HERE',                   // LoggedIn userId
                              'appId': 'PUT_APPLICATION_KEY_HERE',           // obtained from Step 1 (required)
                              'onInit': function(response) { 
                                           if (response === "success") {
                                                 // plugin loaded successfully, perform your actions if any, for example: load contacts, getting unread message count, etc
                                           } else {
                                                 // error in loading plugin (you can hide chat button or refresh page) 
                                           }
                                         }
                            });
```

#### Events subscription

Using events callback, you can subscribe to the following events.

```
applozic.events = {onConnect: function () {
                        console.log('connected successfully');
                  }, onConnectFailed: function () {
                       console.log('connection failed');
                  }, onMessageDelivered: function (obj) {
                       console.log('onMessageDelivered: ' + obj);
                  }, onMessageRead: function (obj) {
                       console.log('onMessageRead: '  + obj);
                  }, onMessageReceived: function (obj) {
                       console.log('onMessageReceived: ' + obj);
                  }, onMessageSentUpdate: function (obj) {
                       console.log('onMessageSentUpdate: ' + obj);
                  }, onUserConnect: function (obj) {
                       console.log('onUserConnect: ' + obj);
                  }, onUserDisconnect: function (obj) {
                       console.log('onUserDisconnect: ' + obj);
                  },
                };
```


Events description:

1) onConnect: Triggered when user subscribed successfully. 


2) onConnectFailed: Triggered when user failed to subscribe. 


3) onMessageDelivered: Triggered when message is delivered. 

{'messageKey': 'delivered-message-key'} 


4) onMessageRead: Triggered when delivered message is read on other end. 

Response object - 

{'messageKey': 'delivered-message-key'}


5) onMessageReceived: Triggered when new message received. 

Response object - {'message': message} 


6) onMessageSentUpdate: Triggered when message sent successfully to server. 

Response object- {'messageKey':'sent-message-key'} 


7) onUserConnect: Triggered when some other user comes online.

Response object - {'userID': 'connected-user-Id'} 


8) onUserDisconnect: Triggered when some other user goes offline. 

Response object - {'userId': 'disconnected-user-id', 'lastSeenAtTime' : 'time in millsec'}


9) onUserBlocked : Triggered when user is blocked or current user blocked other user from different source 

Response object - {'status': 'BLOCKED_TO or BLOCKED_BY', 'userId': userId}


10) onUserUnblocked : Triggered when user is unblocked or current user unblocked other user from different source 

Response object - {'status': 'UNBLOCKED_TO or UNBLOCKED_BY', 'userId': userId}


11) onUserActivated : Triggered when user is activated by app admin 


12) onUserDeactivated : Triggered when user is deactivated by app admin



More details here: 
https://www.applozic.com/developers.html#applozic-web-plugin-getting-started
