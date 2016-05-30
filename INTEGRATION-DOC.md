##### Step 1: Add the Applozic Chat plugin script before ```</head>``` into your web page            

```
<script type="text/javascript">
   (function(d, m){var s, h;       
   s = document.createElement("script");
   s.type = "text/javascript";
   s.async=true;
   s.src="https://apps.applozic.com/sidebox.app";
   h=document.getElementsByTagName('head')[0];
   h.appendChild(s);
   window.applozic=m;
   m.init=function(t){m._globals=t;}})(document, window.applozic || {});
</script>
```
 
##### Step 2: Initialize Chat Plugin

``` 
<script type="text/javascript">
  window.applozic.init({appId: 'PUT_APPLICATION_KEY_HERE', userId: 'PUT_USERID_HERE', userName: 'PUT_USER_DISPLAYNAME_HERE', imageLink : 'PUT_USER_IMAGE_LINK_HERE', email : 'PUT_USER_EMAIL_ID_HERE', contactNumber: 'CONTACT_NUMBER_WITH_INTERNATIONAL_CODE', accessToken: 'PUT USER_AUTHENTICATION_TOKEN_HERE', desktopNotification: true,  notificationIconLink: 'PUT_LOGO_IMAGE_LINK_HERE'});
</script>
```    

It can also be called from any event, for example: on click of a button.

Above options description :-    

```
 appId: 'YOUR APPLICATION KEY'                            // obtained from Step 1 (required)    
 userId: 'UNIQUE USER ID OF ACTIVE USER'                  // loggedIn user Id (required)  
 userName: 'ACTIVE USER DISPLAY NAME'                     // loggedIn user name (optional)  
 imageLink: 'ACTIVE USER IMAGE LINK'                      // loggedIn user image url (optional)   
 email: 'ACTIVE USER EMAIL ID'                            // loggedIn user email Id (optional)       
 contactNumber : 'CONTACT NUMBER OF USER ALONG WITH INTERNATIONAL CODE eg: +919535008745' //optional
 accessToken : 'ACTIVE USER AUTHENTICATION OR PASSWORD'   // optional
 desktopNotification: true or false                       // optional
 notificationIconLink : 'YOUR WEB APP LOGO'               // required for desktop notification (optional)      
```

**Note** : desktopNotification support only for chrome browser, notificationIconLink will be display in desktop notification


##### Step 3: More options with callback functions

```
 1) onInit : function(response) { 
        if (response === "success") {
           // plugin loaded successfully, perform your actions if any, for example: load contacts, getting unread message count, etc
        } else {
           // error in loading plugin (you can hide chat button or refresh page) 
        }
    }                      
    
  Callback function which gets triggered on plugin initialized. You can write your own logic inside this function to execute on plugin initialization. 
  
 2) contactDisplayName: function(userId) {  
          //return the display name of the user from your application code based on userId.
          return "";
    }                    
  Function should return USER_DISPLAY_NAME by taking USERID as input parameter. 
  
 3) contactDisplayImage: function(userId) {  
          //return the display image url of the user from your application code based on userId.
          return "";
    }                 
    
  Function should return USER_IMAGE_URL by taking USERID as a input parameter. 
  
 4) accessToken: 'PASS_USER_ACCESS_TOKEN_HERE'                            //Type - String (optional)    
 
 Access token is to authenticate user from your end. To enable access token authentication you have to configure authentication url in admin dashboard. 
 For more detail about access token, read :**https://www.applozic.com/app-config.html#authentication-url**.
```

Example of how to use above mentioned options:
```
     window.applozic.init({
       userId: USER_ID,
       appId: APPLICATION_KEY,
       onInit: function(response) { 
            if (response === "success") {
               // plugin loaded successfully, perform your actions if any, for example: load contacts, getting unread message count, etc
            } else {
               // error in loading plugin (you can hide chat button or refresh page) 
            }
        }
     });
```


##### Step 4: Contacts

Javascript code to load contacts

```
var CONTACT_LIST_JSON = 
          {"contacts": [{"userId": "USER_1", "displayName": "Devashish", 
                          "imageLink": "https://www.applozic.com/resources/images/applozic_icon.png"}, 
                        {"userId": "USER_2", "displayName": "Adarsh", 
                          "imageLink": "https://www.applozic.com/resources/images/applozic_icon.png"}, 
                        {"userId": "USER_3", "displayName": "Shanki",
                          "imageLink": "https://www.applozic.com/resources/images/applozic_icon.png"}
                        ]
         };  //Replace this with contacts json from your application
         

$applozic.fn.applozic('loadContacts', 'CONTACT_LIST_JSON');

```

**NOTE**- Call **loadContacts** function only after plugin initailize callback (see Step 3 for reference).


##### Step 5: Chat screen

Javascript to open main chat box containing list of contacts

```
 $applozic.fn.applozic('loadTab', '');  
 ``` 
 
Javascript to open chat with User

```
 $applozic.fn.applozic('loadTab', 'PUT_OTHER_USERID_HERE');  // user Id of other person with whom you want to open conversation 
 ``` 
 
 Javascript to open chat with Group

```
 $applozic.fn.applozic('loadGroup', 'PUT_GROUP_ID_HERE');  // group Id returned in response to group create api  
 ``` 

Anchor tag or button to load(open) individual tab conversation directly

Add a chat button inside your web page using ```a``` tag and use 'userId' for data attribute "data-mck-id"   

```
<a href="#" class="applozic-launcher" data-mck-id="PUT_OTHER_USERID_HERE" data-mck-name="PUT_OTHER_USER_DISPLAY_NAME_HERE">CHAT BUTTON</a>
 ```        
 
 **Note** - Data attribute **mck-name** is optional in above tag        
 
 
##### Step 6: Context (Topic) based Chat
 
 Add the following in window.applozic.init call:
 
 ```
  topicBox: true,
  topicDetail: function(topicId) {
         //Based on topicId, return the following details from your application
         return {'title': 'topic-title',      // Product title
                     'subtitle': 'sub-title',     // Product subTitle or Product Id
                     'link' :'image-link',        // Product image link
                     'key1':'key1' ,              // Small text anything like Qty (Optional)
                     'value1':'value1',           // Value of key1 ex-10 (number of quantity) Optional
                     'key2': 'key2',              // Small text anything like MRP (product price) (Optional)
                     'value2':'value2'            // Value of key2 ex-$100  (Optional)
                  };
  }
 ```
 
 Add a chat button inside your web page using ```a``` tag and add the following:
 
 ```
 Class Attribute - applozic-wt-launcher 
 Data Attriutes  - mck-id, mck-name and mck-topicid
```

```
 mck-id      :  User Id of the user with whom to initiate the chat
 mck-name    :  Display name of the user with whom to initiate the chat
 mck-topicId :  Unique identifier for the topic/product 
 ```
 
 ```
 <a href="#" class="applozic-wt-launcher" data-mck-id="PUT_USERID_HERE" data-mck-name="PUT_DISPLAYNAME_HERE" data-mck-topicid="PUT_TOPICID_HERE">CHAT ON TOPIC</a>
 ```
 
  
##### Step 7: Events subscription

Using events callback, you can subscribe to the following events.

```
var apzEvents =  {onConnect: function () {
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
                  }, onUserBlocked: function (obj) {
                       console.log('onUserBlocked: ' + obj);
                  }, onUserUnblocked': function (obj) {
                       console.log('onUserUnblocked: ' + obj);
                  }, onUserActivated: function () {
                       console.log('user activated by admin');
                  }, onUserDeactivated: function () {
                       console.log('user deactivated by admin');
                  }
                };
```

#### Events description:

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

Response object- {'messageKey’: 'sent-message-key'} 


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



#### Javascript to subscribe to events

```
 $applozic.fn.applozic('subscribeToEvents', apzEvents);  // object containing event definations 
 ``` 

 
 
 
### UI Customization
 
 
 For customizing the UI, download files from https://github.com/AppLozic/Applozic-Web-Plugin/tree/master/message/advanced
 Open message.html file as a reference and add all scripts and html in your web page in same order as given in message.html
 
 You can modify mck-sidebox-1.0.css class located at:
 https://github.com/AppLozic/Applozic-Web-Plugin/blob/master/message/advanced/css/app/mck-sidebox-1.0.css

  
  
###Advance options
 
 
####  Send message

Send message from logged in user to another user
 ```
 var messageJson = 
          {"to":'USER_ID',                                 // required
           "message" : 'TEXT_MESSAGE'                      // required
        }; 
$applozic.fn.applozic('sendMessage', messageJson);
 ```



Send message visible only to the receiver.
 ```
var messageJson = 
          {"to":'USER_ID',                                     // required
           "type" : 12,                                        // required
           "message" : 'TEXT_MESSAGE'                          // required
        };  
$applozic.fn.applozic('sendMessage', messageJson);
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

Javascript to subscribe to events

```
 applozic.events = apzEvents;      // apzEvents defined in Step:7
 ``` 
