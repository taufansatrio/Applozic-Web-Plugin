var $applozic = jQuery.noConflict(true);
var $appModal = $applozic.fn.modal.noConflict();
$applozic.fn.modal = $appModal;
(function ($applozic, w, d) {
    "use strict";
    var default_options = {
        baseUrl: "https://applozic.appspot.com",
        launcher: "applozic-launcher",
        userId: null,
        appId: null,
        supportId: null,
        mode: "standard",
        olStatus: false,
        desktopNotification: false,
        maxAttachmentSize: 25          //default size is 25MB
    };
    $applozic.fn.applozic = function (options, paramValue) {
        var $mck_sidebox = $applozic('#mck-sidebox');
        if (typeof options.ojq !== 'undefined') {
            $ = options.ojq;
            jQuery = options.ojq;
        } else {
            $ = $applozic;
            jQuery = $applozic;
            $.fn.modal = $appModal;
        }
        if ($applozic.type(options) === "object") {
            options = $applozic.extend(true, {}, default_options, options);
        }
        var oInstance = undefined;
        if (typeof ($mck_sidebox.data("applozic_instance")) !== "undefined") {
            oInstance = $mck_sidebox.data("applozic_instance");
            if ($applozic.type(options) === "string") {
                switch (options) {
                    case "loadTab" :
                        oInstance.loadTab(paramValue);
                        break;
                    case "loadContacts" :
                        oInstance.loadContacts(paramValue);
                }
            }
        } else {
            var applozic = new Applozic(options);
            applozic.init();
            $mck_sidebox.data("applozic_instance", applozic);
        }
    };
    $applozic.fn.applozic.defaults = default_options;
    function Applozic(options) {
        var _this = this;
        var MCK_BASE_URL = options.baseUrl;
        var MCK_TOKEN;
        var APPLICATION_ID = options.appId;
        var USER_NUMBER;
        var MCK_USER_ID = options.userId;
        var USER_COUNTRY_CODE;
        var USER_DEVICE_KEY;
        var AUTH_CODE;
        var MCK_LAUNCHER = options.launcher;
        var MCK_CALLBACK = options.readConversation;
        var MCK_GETUSERNAME = options.contactDisplayName;
        var MCK_GETUSERIMAGE = options.contactDisplayImage;
        var IS_MCK_OL_STATUS = (typeof options.olStatus === "boolean") ? (options.olStatus) : false;
        var MCK_TEXTBOX_FOCUSED = false;
        var MCK_SUPPORT_ID_DATA_ATTR = (options.supportId) ? ('data-mck-id="' + options.supportId + '"') : '';
        var MCK_MODE = options.mode;
        var MCK_USER_TIMEZONEOFFSET;
        var MCK_FILEMAXSIZE = options.maxAttachmentSize;
        var FILE_METAS = "";
        var ELEMENT_NODE = 1;
        var IS_MCK_NOTIFICATION = (typeof options.desktopNotification === "boolean") ? options.desktopNotification : false;
        var TEXT_NODE = 3;
        var TAGS_BLOCK = ['p', 'div', 'pre', 'form'];
        var MCK_CONTACT_MAP = [];
        var TAB_MESSAGE_DRAFT = new Object();
        var TAB_FILE_DRAFT = new Object();
        var MCK_CONTACT_ARRAY = new Array();
        var MCK_CONTACT_NAME_MAP = new Array();
        var mckStorage = new MckStorage();
        var mckUtils = new MckUtils();
        var mckMessageService = new MckMessageService();
        var mckContactService = new MckContactService();
        var mckFileService = new MckFileService();
        var mckMessageLayout = new MckMessageLayout();
        var mckContactUtils = new MckContactUtils();
        var mckDateUtils = new MckDateUtils();
        var mckInitializeChannel = "";
        var mckNotificationService = new MckNotificationService();
        w.MCK_OL_MAP = new Array();
        _this.getOptions = function () {
            return options;
        };
        _this.init = function () {
            mckMessageService.init(options);
            mckFileService.init();
            mckUtils.initializeApp(options);
            mckNotificationService.init();
            $applozic("#mck-text-box").emojiarea({button: "#mck-btn-smiley",
                wysiwyg: true,
                menuPosition: 'top'});
        };
        _this.loadTab = function (userId) {
            mckMessageLayout.loadTab(userId);
            $applozic("#mck-search").val("");
        };
        _this.loadContacts = function (contacts) {
            mckMessageLayout.loadContacts(contacts);
        };
        function MckUtils() {
            var _this = this;
            var $mck_text_box = $applozic("#mck-text-box");
            var INITIALIZE_APP_URL = "/tab/initialize.page";

            _this.getLauncherHtml = function () {
                return '<div id="mck-sidebox-launcher" class="mck-sidebox-launcher">' +
                        '<a href="#" class="applozic-launcher mck-button-launcher" ' + (MCK_MODE === 'support' ? MCK_SUPPORT_ID_DATA_ATTR : '') + '></a>' +
                        '<div id="mck-msg-preview" class="mck-msg-preview applozic-launcher">' +
                        '<div class="mck-row">' +
                        '<div class="blk-lg-3 mck-preview-icon">' +
                        '</div>' +
                        '<div class="blk-lg-9">' +
                        '<div class="mck-row mck-truncate mck-preview-content">' +
                        '<strong class="mck-preview-cont-name"></strong>' +
                        '</div>' +
                        '<div class="mck-row mck-preview-content">' +
                        '<div class="mck-preview-msg-content"></div>' +
                        '<div class="mck-preview-file-content mck-msg-text notranslate blk-lg-12 mck-attachment n-vis"></div>' +
                        '</div></div></div></div></div>';
            };
            _this.initializeApp = function (options) {
                var data = "applicationId=" + options.appId + "&userId=" + options.userId;
                $applozic.ajax({
                    url: MCK_BASE_URL + INITIALIZE_APP_URL + "?" + data,
                    type: 'get',
                    success: function (result) {
                        if (result === "INVALID_APPID") {
                            alert("Oops! looks like incorrect application id.");
                            return;
                        }
                        result = $applozic.parseJSON(result);
                        if (typeof result.token !== undefined) {
                            MCK_TOKEN = result.token;
                            USER_NUMBER = result.contactNumber;
                            USER_COUNTRY_CODE = result.countryCode;
                            USER_DEVICE_KEY = result.deviceKeyString;
                            MCK_USER_TIMEZONEOFFSET = result.timeZoneOffset;
                            AUTH_CODE = btoa(result.userId + ":" + result.deviceKeyString);
                            $applozic.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                                if (!options.beforeSend) {
                                    options.beforeSend = function (jqXHR) {
                                        jqXHR.setRequestHeader("UserId-Enabled", true);
                                        jqXHR.setRequestHeader("Authorization", "Basic " + AUTH_CODE);
                                        jqXHR.setRequestHeader("Application-Key", APPLICATION_ID);
                                    };
                                }
                            });
                            _this.appendLauncher();
                            $applozic(".applozic-launcher").each(function () {
                                if (!$applozic(this).hasClass("mck-msg-preview")) {
                                    $applozic(this).show();
                                }
                            });
                            //$("." + MCK_LAUNCHER).removeClass("hide");
                            mckInitializeChannel = new MckInitializeChannel(MCK_TOKEN);
                            mckStorage.clearMckMessageArray();
                            var mckContactNameArray = mckStorage.getMckContactNameArray();
                            if (mckContactNameArray !== null && mckContactNameArray.length > 0) {
                                for (var i = 0; i < mckContactNameArray.length; i++) {
                                    var nameMap = mckContactNameArray[i];
                                    if (nameMap !== null) {
                                        MCK_CONTACT_NAME_MAP[nameMap[0]] = nameMap[1];
                                    }
                                }
                            }
                        } else {
                            alert("Unable to initiate app");
                        }
                    },
                    error: function () {
                        alert('Unable to process your request. Please try again.');
                    }
                });
                $mck_text_box.focus(function () {
                    MCK_TEXTBOX_FOCUSED = true;
                });
                $mck_text_box.blur(function () {
                    MCK_TEXTBOX_FOCUSED = false;
                });
                $applozic(d).on("click", ".fancybox", function (e) {
                    var href = $applozic(this).find('img').data('imgurl');
                    $applozic(this).fancybox({
                        openEffect: 'none',
                        closeEffect: 'none',
                        'padding': 0,
                        'href': href,
                        'type': 'image'
                    });
                });
            };
            _this.appendLauncher = function () {
                $applozic("#mck-sidebox-launcher").remove();
                $applozic("body").append(_this.getLauncherHtml());
                mckNotificationService.init();
            };
            _this.randomId = function () {
                return w.Math.random().toString(36).substring(7);
            };
            _this.textVal = function () {
                var lines = [];
                var line = [];
                var flush = function () {
                    lines.push(line.join(''));
                    line = [];
                };
                var sanitizeNode = function (node) {
                    if (node.nodeType === TEXT_NODE) {
                        line.push(node.nodeValue);
                    } else if (node.nodeType === ELEMENT_NODE) {
                        var tagName = node.tagName.toLowerCase();
                        var isBlock = TAGS_BLOCK.indexOf(tagName) !== -1;
                        if (isBlock && line.length) {
                            flush();
                        }
                        if (tagName === 'img') {
                            var alt = node.getAttribute('alt') || '';
                            if (alt) {
                                line.push(alt);
                            }
                            return;
                        } else if (tagName === 'br') {
                            flush();
                        }
                        var children = node.childNodes;
                        for (var i = 0; i < children.length; i++) {
                            sanitizeNode(children[i]);
                        }
                        if (isBlock && line.length) {
                            flush();
                        }
                    }
                };
                var children = $mck_text_box[0].childNodes;
                for (var i = 0; i < children.length; i++) {
                    sanitizeNode(children[i]);
                }
                if (line.length) {
                    flush();
                }
                return lines.join('\n');
            };
            _this.mouseX = function (evt) {
                if (evt.pageX) {
                    return evt.pageX;
                } else if (evt.clientX) {
                    return evt.clientX + (d.documentElement.scrollLeft ?
                            d.documentElement.scrollLeft : d.body.scrollLeft);
                } else {
                    return null;
                }
            };
            _this.mouseY = function (evt) {
                if (evt.pageY) {
                    return evt.pageY;
                } else if (evt.clientY) {
                    return evt.clientY + (d.documentElement.scrollTop ?
                            d.documentElement.scrollTop : d.body.scrollTop);
                } else {
                    return null;
                }
            };
        }

        function MckMessageService() {
            var _this = this;
            var $mck_search = $applozic("#mck-search");
            var $mck_msg_to = $applozic("#mck-msg-to");
            var $mck_add_new = $applozic(".mck-add-new");
            var $mck_msg_new = $applozic("#mck-msg-new");
            var $mck_sidebox = $applozic("#mck-sidebox");
            var $mck_file_box = $applozic("#mck-file-box");
            var $mck_text_box = $applozic("#mck-text-box");
            var $mck_msg_form = $applozic("#mck-msg-form");
            var $mck_msg_sbmt = $applozic("#mck-msg-sbmt");
            var $mck_msg_error = $applozic("#mck-msg-error");
            var $mck_show_more = $applozic("#mck-show-more");
            var $mck_msg_cell = $applozic("#mck-message-cell");
            var $mck_loading = $applozic("#mck-contact-loading");
            var $mck_msg_response = $applozic("#mck-msg-response");
            var $mck_delete_button = $applozic("#mck-delete-button");
            var $mck_response_text = $applozic("#mck_response_text");
            var $mck_top_btn_panel = $applozic("#mck-top-btn-panel");
            var $mck_sidebox_search = $applozic("#mck-sidebox-search");
            var $mck_show_more_icon = $applozic("#mck-show-more-icon");
            var $mck_sidebox_content = $applozic(".mck-sidebox-content");
            var $modal_footer_content = $applozic(".mck-box-ft .modal-form");
            var $mck_textbox_container = $applozic("#mck-textbox-container");
            var $mck_conversation_title = $applozic("#mck-conversation-title");
            var $mck_msg_inner = $applozic("#mck-message-cell .mck-message-inner");
            var $mck_search_inner = $applozic("#mck-search-cell .mck-message-inner");
            var MESSAGE_ADD_URL = "/rest/ws/mobicomkit/v1/message/add";
            var MESSAGE_LIST_URL = "/rest/ws/mobicomkit/v1/message/list";
            var MESSAGE_DELETE_URL = "/rest/ws/mobicomkit/v1/message/delete";
            var MESSAGE_DELIVERY_UPDATE_URL = "/rest/ws/sms/mtext/delivered";
            var offlineblk = '<div id="mck-ofl-blk" class="mck-m-b"><div class="mck-clear"><div class="blk-lg-12 mck-text-light mck-text-muted mck-test-center">${userIdExpr} is offline now</div></div></div>';
            $applozic.template("oflTemplate", offlineblk);
            $applozic(d).on("click", ".mck-message-delete", function () {
                _this.deleteMessage($applozic(this).parents('.mck-m-b').data("msgkeystring"));
            });
            $applozic(".mck-minimize-icon").click(function () {
                $applozic(".mck-box-md,.mck-box-ft").animate({
                    height: "toggle"
                });
                if ($mck_sidebox_content.hasClass("minimized")) {
                    $mck_sidebox_content.css('height', '100%');
                    $mck_sidebox_content.removeClass("minimized");
                } else {
                    $mck_sidebox_content.css('height', '0%');
                    $mck_sidebox_content.addClass("minimized");
                }
            });
            _this.init = function () {
                mckStorage.clearMckMessageArray();
                $applozic(d).on("click", "." + MCK_LAUNCHER, function () {
                    if ($applozic(this).hasClass('mck-msg-preview')) {
                        $applozic(this).hide();
                    }
                });
                $mck_msg_new.click(function () {
                    $mck_add_new.removeClass('vis').addClass('n-vis');
                    $mck_sidebox_content.removeClass('vis').addClass('n-vis');
                    $mck_sidebox_search.removeClass('n-vis').addClass('vis');
                    $mck_search_inner.html('<ul id="mck-search-list" class="mck-search-list mck-contact-list mck-nav mck-nav-tabs mck-nav-stacked"></ul>');
                    if (MCK_CONTACT_ARRAY.length !== 0) {           
                        mckMessageLayout.addContactsToSearchList([], true);
                    } else if (IS_MCK_OL_STATUS) {
                        mckContactService.loadContacts();
                    } else {
                        $mck_search_inner.html('<div class="mck-no-data-text mck-text-muted">No contacts yet!</div>');
                    }
                    $mck_search.focus();
                });
                $mck_text_box.keydown(function (e) {
                    if (e.keyCode === 13 && (e.shiftKey || e.ctrlKey)) {
                        e.preventDefault();
                        if (w.getSelection) {
                            var selection = w.getSelection(),
                                    range = selection.getRangeAt(0),
                                    br = d.createElement("br"),
                                    textNode = d.createTextNode("\u00a0"); //Passing " " directly will not end up being shown correctly
                            range.deleteContents(); //required or not?
                            range.insertNode(br);
                            range.collapse(false);
                            range.insertNode(textNode);
                            range.selectNodeContents(textNode);
                            selection.removeAllRanges();
                            selection.addRange(range);
                            return false;
                        }
                    } else if (e.keyCode === 13) {
                        e.preventDefault();
                        if ($mck_msg_sbmt.is(':disabled') && $mck_file_box.hasClass('vis')) {
                            alert('Please wait file is uploading.');
                        } else {
                            $mck_msg_form.submit();
                        }
                    }
                });
                $applozic(d).on("click", ".mck-delete-button", function () {
                    var userId = $mck_msg_to.val();
                    if (typeof userId !== 'undefined') {
                        if (confirm("Are you sure want to delete all the conversation!")) {
                            $applozic.ajax({
                                type: "get",
                                url: MCK_BASE_URL + "/rest/ws/mobicomkit/v1/message/delete/conversation.task",
                                global: false,
                                data: "userId=" + userId,
                                success: function () {
                                    $mck_msg_inner.html("");
                                    $mck_msg_cell.removeClass('n-vis').addClass('vis');
                                    mckStorage.clearMckMessageArray();
                                    $mck_msg_inner.html('<div class="mck-no-data-text mck-text-muted">No messages yet!</div>');
                                    $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                    $mck_msg_inner.removeClass('mck-msg-w-panel');
                                },
                                error: function () {
                                }
                            });
                        }
                        else {
                            return;
                        }
                    }
                });
                $applozic(d).on("click", "." + MCK_LAUNCHER + ",.mck-conversation-tab-link, .mck-contact-list ." + MCK_LAUNCHER, function (e) {
                    e.preventDefault();
                    mckMessageLayout.loadTab($applozic(this).data("mck-id"));
                    $mck_search.val("");
                    $applozic("#mck-sidebox-launcher").removeClass('vis').addClass('n-vis');
                });
                $applozic(d).on("click", ".mck-close-sidebox", function (e) {
                    e.preventDefault();
                    $applozic("#mck-sidebox-launcher").removeClass('n-vis').addClass('vis');
                    $mck_sidebox.modal('hide');
                });
                $applozic(d).on("click", ".mck-tab-search", function (e) {
                    e.preventDefault();
                    var userId = $mck_search.val();
                    if (userId !== "") {
                        mckMessageLayout.loadTab(userId);
                        $modal_footer_content.removeClass('n-vis').addClass('vis');
                    }
                    $mck_search.val("");
                });
                $applozic(d).on("click", ".mck-show-more", function (e) {
                    e.preventDefault();
                    mckMessageService.loadMoreMessages();
                });
                $mck_msg_form.submit(function () {
                    if (!USER_DEVICE_KEY) {
                        alert("Unable to initiate app. Please reload page.");
                        return;
                    }
                    var message = $applozic.trim(mckUtils.textVal());
                    if ($mck_file_box.hasClass('n-vis') && FILE_METAS) {
                        FILE_METAS = "";
                    }
                    if (message.length === 0 && !FILE_METAS) {
                        $mck_textbox_container.addClass("mck-text-req");
                        return false;
                    }
                    var messagePxy = {
                        'to': $mck_msg_to.val(),
                        'contactIds': $mck_msg_to.val(),
                        'deviceKeyString': USER_DEVICE_KEY,
                        'type': 5,
                        'message': message,
                        'sendToDevice': true
                    };
                    if (FILE_METAS) {
                        messagePxy.fileMetaKeyStrings = FILE_METAS;
                    }
                    $mck_msg_sbmt.attr('disabled', true);
                    $mck_msg_sbmt.html('Sending...');
                    $mck_msg_error.removeClass('vis').addClass('n-vis');
                    $mck_msg_error.html("");
                    $mck_response_text.html("");
                    $mck_msg_response.removeClass('vis').addClass('n-vis');
                    return _this.sendMessage(messagePxy);
                });
                $applozic("#mck-msg-form input").on('click', function () {
                    $applozic(this).val("");
                    $mck_msg_error.removeClass('vis').addClass('n-vis');
                    $mck_msg_response.removeClass('vis').addClass('n-vis');
                });
                $mck_text_box.on('click', function (e) {
                    e.preventDefault();
                    $mck_textbox_container.removeClass('mck-text-req');
                });
                $applozic(d).bind("click", function () {
                    $applozic(".mck-context-menu").removeClass("vis").addClass("n-vis");
                });
            };
            $mck_search.keydown(function (event) {
                if (event.keyCode === 13) {
                    var userId = $applozic(this).val();
                    if (userId !== "") {
                        mckMessageLayout.loadTab(userId);
                        $modal_footer_content.removeClass('n-vis').addClass('vis');
                    }
                    $applozic(this).val("");
                    return false;
                }
            });
            _this.sendMessage = function (messagePxy) {
                var randomId = mckUtils.randomId();
                var userId = $mck_msg_inner.data('mck-id');
                var message = {
                    'to': messagePxy.to,
                    'contactIds': messagePxy.contactIds,
                    'deviceKeyString': messagePxy.deviceKeyString,
                    'type': 5,
                    'message': messagePxy.message,
                    'sendToDevice': true,
                    'createdAtTime': new Date().getTime(),
                    'keyString': randomId,
                    'storeOnDevice': true,
                    'sent': false,
                    'shared': false,
                    'read': true
                };
                if (!FILE_METAS) {
                    var isTopPanelAdded = false;
                    var contactIds = message.contactIds;
                    if (contactIds.lastIndexOf(",") === contactIds.length - 1) {
                        contactIds = contactIds.substring(0, contactIds.length - 1);
                    }
                    var contactIdsArray = contactIds.split(",");
                    for (var i = 0; i < contactIdsArray.length; i++) {
                        var contact = mckMessageLayout.getContact(contactIdsArray[i]);
                        if (typeof contact === "undefined") {
                            contact = mckMessageLayout.createContact(contactIdsArray[i]);
                        }
                        if (typeof userId !== "undefined" && userId === contact.contactId) {
                            mckMessageLayout.addMessage(message, true, true);
                            if ($mck_top_btn_panel.hasClass('n-vis')) {
                                isTopPanelAdded = true;
                            }
                        }
                    }
                    $mck_msg_sbmt.attr('disabled', false);
                    $mck_msg_sbmt.html('Send');
                    if ($applozic("#mck-message-cell .mck-no-data-text").length > 0) {
                        $applozic(".mck-no-data-text").remove();
                    }
                    var $mck_msg_div = $applozic("#mck-message-cell .mck-message-inner div[name='message']." + randomId);
                    mckMessageLayout.clearMessageField();
                }
                $applozic("." + randomId + " .mck-message-status").removeClass('mck-icon-ok-circle').addClass('mck-icon-time');
                $applozic.ajax({
                    type: "POST",
                    url: MCK_BASE_URL + MESSAGE_ADD_URL,
                    global: false,
                    data: w.JSON.stringify(messagePxy),
                    contentType: 'application/json',
                    headers: {
                        "UserId-Enabled": true,
                        'Authorization': "Basic " + AUTH_CODE,
                        'Application-Key': APPLICATION_ID
                    },
                    success: function (data) {
                        if (data === 'error') {
                            $mck_msg_error.html("Unable to process your request. Please try again");
                            $mck_msg_error.removeClass('n-vis').addClass('vis');
                            $mck_msg_div.remove();
                            if (isTopPanelAdded) {
                                $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                $mck_msg_inner.removeClass('mck-msg-w-panel');
                            }
                        } else {
                            if (!FILE_METAS) {
                                $mck_msg_div.removeClass(randomId).addClass(data);
                                $mck_msg_div.data('msgkeystring', data);
                                $applozic("." + data + " .mck-message-status").removeClass('mck-icon-time').addClass('mck-icon-ok-circle').attr('title', 'sent');
                            } else {
                                $mck_msg_sbmt.attr('disabled', false);
                                $mck_msg_sbmt.html('Send');
                                mckMessageLayout.clearMessageField();
                            }
                            mckStorage.clearMckMessageArray();
                            mckMessageLayout.messageContextMenu(data);
                        }
                        delete TAB_MESSAGE_DRAFT[userId];
                        FILE_METAS = "";
                    },
                    error: function () {
                        $mck_msg_error.html('Unable to process your request. Please try again.');
                        $mck_msg_error.removeClass('n-vis').addClass('vis');
                        if (!FILE_METAS) {
                            $mck_msg_div.remove();
                        }
                        $mck_msg_sbmt.attr('disabled', false);
                        $mck_msg_sbmt.html('Send');
                        mckMessageLayout.clearMessageField();
                        FILE_METAS = "";
                    }
                });
                return false;
            };
            _this.deleteMessage = function (msgkeystring) {
                var userId = $mck_msg_inner.data('mck-id');
                if (typeof userId !== 'undefined') {
                    $applozic.ajax({
                        url: MCK_BASE_URL + MESSAGE_DELETE_URL +  "?key=" + msgkeystring + '&contactNumber=' + userId,
                        type: 'get',
                        headers: {
                            "UserId-Enabled": true,
                            'Authorization': "Basic " + AUTH_CODE,
                            'Application-Key': APPLICATION_ID
                        },
                        success: function (data) {
                            if (data === 'success') {
                                $applozic("." + msgkeystring).remove();
                                mckStorage.clearMckMessageArray();
                                if ($mck_msg_inner.is(":empty")) {
                                    $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                    $mck_msg_inner.removeClass('mck-msg-w-panel');
                                }
                            } else {
                                alert('Unable to process your request. Please try again.');
                            }
                        }
                    });
                }
            };
            _this.loadMessageList = function (userId) {
                var userIdParam = "";
                var individual = true;
                var pageSize = 10;
                if (typeof userId !== "undefined" && userId !== "") {
                    userIdParam = "&userId=" + userId;
                    $mck_msg_to.val(userId);
                    $mck_show_more.data('userId', userId);
                    $mck_add_new.removeClass('vis').addClass('n-vis');
                    $modal_footer_content.removeClass('n-vis').addClass('vis');
                    $mck_msg_to.parent('.mck-form-group').removeClass('vis').addClass('n-vis');
                    $mck_delete_button.removeClass('n-vis').addClass('vis');
                    var displayName = "";
                    if (typeof (MCK_GETUSERNAME) === "function") {
                        displayName = MCK_GETUSERNAME(userId);
                    }
                    if (!displayName) {
                        displayName = mckMessageLayout.getContactDisplayName(userId);
                    }
                    if (!displayName) {
                        displayName = userId;
                    }
                    $mck_conversation_title.html('<div class="mck-tab-link blk-lg-4"><a href="#" role="link" class="mck-conversation-tab-link"><img src="' + MCK_BASE_URL + '/resources/sidebox/images/ic_action_backward.png" alt="Back"></a></div>' + displayName);
                    if (MCK_MODE === 'support') {
                        $applozic('.mck-tab-link').removeClass('vis').addClass('n-vis');
                    }
                } else {
                    userId = "";
                    individual = false;
                    pageSize = 50;
                    $mck_conversation_title.html('Conversations');
                    $mck_msg_inner.data('mck-id', "");
                    $mck_msg_inner.removeClass('mck-msg-w-panel');
                    $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                    $mck_delete_button.removeClass('vis').addClass('n-vis');
                    $mck_msg_to.val("");
                    $mck_msg_to.parent('.mck-form-group').removeClass('n-vis').addClass('vis');
                    $modal_footer_content.removeClass('vis').addClass('n-vis');
                    $mck_add_new.removeClass('n-vis').addClass('vis');
                    var mckMessageArray = mckStorage.getMckMessageArray();
                    if (mckMessageArray !== null && mckMessageArray.length > 0) {
                        mckMessageLayout.addContactsFromMessageList({
                            message: mckMessageArray
                        });
                        $mck_msg_inner.animate({
                            scrollTop: $mck_msg_inner.prop("scrollHeight")
                        }, 0);
                        return;
                    }
                }
                w.MCK_OL_MAP = [];
                $mck_msg_inner.html("");
                $mck_loading.removeClass('n-vis').addClass('vis');
                if (individual) {
                    $mck_msg_inner.data('mck-id', userId);
                } else {
                    $mck_msg_inner.data('mck-id', "");
                }
                $applozic.ajax({
                    url: MCK_BASE_URL + MESSAGE_LIST_URL + "?startIndex=0&pageSize=" + pageSize + userIdParam,
                    type: 'get',
                    global: false,
                    success: function (data) {
                        var currUserId = $mck_msg_inner.data('mck-id');
                        if (userId === currUserId) {
                            if (data + '' === "null" || typeof data.message === "undefined" || data.message.length === 0) {
                                if (individual) {
                                    if ($applozic("#mck-message-cell .mck-message-inner div[name='message']").length === 0) {
                                        $mck_msg_inner.removeClass('mck-msg-w-panel');
                                        $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                        $mck_msg_inner.html('<div class="mck-no-data-text mck-text-muted">No messages yet!</div>');
                                    }
                                } else {
                                        $mck_msg_inner.html('<div class="mck-no-data-text mck-text-muted">No conversations yet!</div>');
                                    }
                            } else {
                                var userIdArray = mckMessageLayout.getUserIdArrayFromMessageList(data);
                                mckContactService.getContactDisplayName(userIdArray);
                                if (individual) {
                                    if (data.connectedUsers.length === 0) {
                                        w.MCK_OL_MAP[userId] = false;
                                    } else {
                                        w.MCK_OL_MAP[userId] = true;
                                    }
                                    mckMessageLayout.processMessageList(data, true);
                                    $mck_top_btn_panel.removeClass('n-vis').addClass('vis');
                                    $mck_msg_inner.addClass('mck-msg-w-panel');
                                    if (typeof (MCK_CALLBACK) === "function") {
                                        MCK_CALLBACK(userId);
                                    }
                                } else {
                                    if (data.connectedUsers.length > 0) {
                                        var connectedUsers = data.connectedUsers;
                                        for (var i = 0; i < connectedUsers.length; i++) {
                                            w.MCK_OL_MAP[connectedUsers[i]] = true;
                                        }
                                    }
                                    mckMessageLayout.addContactsFromMessageList(data);
                                    mckStorage.setMckMessageArray(data.message);
                                }
                            }
                        }
                        $mck_loading.removeClass('vis').addClass('n-vis');
                        $mck_msg_inner.animate({
                            scrollTop: $mck_msg_inner.prop("scrollHeight")
                        }, 0);
                    },
                    error: function () {
                        $mck_loading.removeClass('vis').addClass('n-vis');
                        alert('Unable to process your request.');
                    }
                });
            };
            _this.loadMoreMessages = function () {
                var userId = $mck_show_more.data("userId");
                if (typeof userId !== "undefined") {
                    $mck_show_more.attr("disabled", true);
                    var data = "userId=" + userId + "&startIndex=0&pageSize=30&endTime=" + $mck_show_more.data('datetime');
                    $mck_show_more_icon.removeClass('vis').addClass('n-vis');
                    $mck_loading.removeClass('n-vis').addClass('vis');
                    $applozic.ajax({
                        url: MCK_BASE_URL + MESSAGE_LIST_URL,
                        data: data,
                        global: false,
                        type: 'get',
                        success: function (data) {
                            $mck_loading.removeClass('vis').addClass('n-vis');
                            var currUserId = $mck_msg_inner.data('mck-id');
                            if (userId === currUserId) {
                                if (data + '' === "null" || typeof data.message === "undefined" || data.message.length === 0) {
                                    $mck_show_more_icon.removeClass('n-vis').addClass('vis');
                                    $mck_show_more_icon.fadeOut(3000, function () {
                                        $mck_show_more_icon.removeClass('vis').addClass('n-vis');
                                    });
                                }
                                mckMessageLayout.processMessageList(data, false);
                            }
                            $mck_show_more.attr("disabled", false);
                        },
                        error: function () {
                            $mck_show_more.attr("disabled", false);
                            alert('Unable to process your request. Please try refreshing the page.');
                        }
                    });
                }
            };
            _this.updateContactList = function (userId) {
                var paramData = "startIndex=0&pageSize=1&userId=" + userId;
                $applozic.ajax({
                    url: MCK_BASE_URL + MESSAGE_LIST_URL,
                    data: paramData,
                    global: false,
                    type: 'get',
                    success: function (data) {
                        if (data + '' === "null" || typeof data.message === "undefined" || data.message.length === 0) {
                            mckMessageLayout.clearContactMessageData(userId);
                        } else {
                            var message = data.message[0];
                            if (typeof message !== 'undefined') {
                                mckMessageLayout.addContactsFromMessage(message, true);
                            }
                        }
                    },
                    error: function () {
                        mckMessageLayout.clearContactMessageData(userId);
                    }
                });
            };
            _this.updateDeliveryStatus = function (message) {
                var data = "userId=" + MCK_USER_ID + "&smsKeyString=" + message.pairedSmsKeyString;
                $applozic.ajax({
                    url: MCK_BASE_URL + MESSAGE_DELIVERY_UPDATE_URL,
                    data: data,
                    global: false,
                    type: 'get',
                    success: function () {
                    },
                    error: function () {
                    }
                });
            };
        }

        function MckContactUtils() {
            var _this = this;
            _this.getContactId = function (contact) {
                var contactId = contact.contactId;
                return _this.formatContactId(contactId);
            };
            _this.formatContactId = function (contactId) {
                if (contactId.indexOf("+") === 0) {
                    contactId = contactId.substring(1);
                }
                return contactId.replace(/\@/g, "AT").replace(/\./g, "DOT").replace(/\*/g, "STAR").replace(/\#/g, "HASH");
            };
        }

        function MckMessageLayout() {
            var _this = this;
            var $mck_msg_to = $applozic("#mck-msg-to");
            var $file_name = $applozic(".mck-file-lb");
            var $file_size = $applozic(".mck-file-sz");
            var $mck_add_new = $applozic(".mck-add-new");
            var $mck_sidebox = $applozic("#mck-sidebox");
            var $mck_file_box = $applozic("#mck-file-box");
            var $mck_msg_sbmt = $applozic("#mck-msg-sbmt");
            var $mck_msg_form = $applozic("#mck-msg-form");
            var $mck_text_box = $applozic("#mck-text-box");
            var $mck_msg_error = $applozic("#mck-msg-error");
            var $mck_show_more = $applozic("#mck-show-more");
            var $mck_msg_cell = $applozic("#mck-message-cell");
            var $mck_loading = $applozic("#mck-contact-loading");
            var $mck_msg_response = $applozic("#mck-msg-response");
            var $mck_response_text = $applozic("#mck_response_text");
            var $mck_top_btn_panel = $applozic("#mck-top-btn-panel");
            var $file_progress = $applozic("#mck-file-box .progress");
            var $mck_sidebox_search = $applozic("#mck-sidebox-search");
            var $mck_search_loading = $applozic("#mck-search-loading");
            var $mck_sidebox_content = $applozic("#mck-sidebox-content");
            var $file_remove = $applozic("#mck-file-box .mck-remove-file");
            var $mck_textbox_container = $applozic("#mck-textbox-container");
            var $modal_footer_content = $applozic(".modal-footer .modal-form");
            var $mck_msg_inner = $applozic("#mck-message-cell .mck-message-inner");
            var FILE_PREVIEW_URL = "/rest/ws/file/shared/";
            var USER_ICON_URL = "/resources/sidebox/images/ic_action_user.png";
            var markup = '<div name="message" data-msgdelivered="${msgDeliveredExpr}" data-msgsent="${msgSentExpr}" data-msgtype="${msgTypeExpr}" data-msgtime="${msgCreatedAtTime}" data-msgcontent="${replyIdExpr}" data-msgkeystring="${msgKeyExpr}" data-contact="${contactIdsExpr}" class="mck-m-b ${msgKeyExpr}"><div class="mck-clear"><div class="blk-lg-12"><div class="${msgFloatExpr} mck-msg-box ${msgClassExpr}">' +
                    '<div class="mck-msg-text mck-msg-content"></div>' +
                    '<div class="mck-file-text mck-msg-text notranslate blk-lg-12 mck-attachment n-vis" data-filemetakeystring="${fileMetaKeyExpr}" data-filename="${fileNameExpr}" data-filesize="${fileSizeExpr}">{{html fileExpr}}</div>' +
                    '<div class="n-vis mck-context-menu">' +
                    '<ul><li><a class="mck-message-delete">Delete</a></li></ul></div>' +
                    '</div></div>' +
                    '<div class="${msgFloatExpr}-muted mck-text-light mck-text-muted mck-text-xs mck-t-xs">${createdAtTimeExpr} <i class="${statusIconExpr} mck-message-status"></i></div>' +
                    '</div></div>';
            var contactbox = '<li id="li-${contHtmlExpr}" class="${contIdExpr}" data-msg-time="${msgCreatedAtTimeExpr}">' +
                    '<a class="${mckLauncherExpr}" href="#" data-mck-id="${contIdExpr}">' +
                    '<div class="mck-row" title="${contNameExpr}">' +
                    '<div class="blk-lg-3">{{html contImgExpr}}</div>' +
                    '<div class="blk-lg-9">' +
                    '<div class="mck-row">' +
                    '<div class="blk-lg-8 mck-cont-name mck-truncate"><div class="mck-ol-status ${contOlExpr}"><span class="mck-ol-icon" title="online"></span>&nbsp;</div><strong>${contNameExpr}</strong></div>' +
                    '<span class="mck-text-muted move-right mck-cont-msg-date">${msgCreatedDateExpr}</span>' +
                    '</div>' +
                    '<div class="mck-cont-msg-wrapper blk-lg-12 mck-truncate">{{html msgTextExpr}}</div>' +
                    '</div>' +
                    '</div></a></li>';
            $applozic.template("messageTemplate", markup);
            $applozic.template("contactTemplate", contactbox);
            _this.openConversation = function () {
                if ($mck_sidebox.css('display') === 'none') {
                    $applozic('.modal').modal('hide');
                    $mck_sidebox.modal();
                }
                $mck_msg_to.focus();
            };
            _this.loadTab = function (userId) {
                var currUserId = $mck_msg_inner.data('mck-id');
                if (currUserId) {
                    if ($mck_text_box.html().length > 1 || $mck_file_box.hasClass('vis')) {
                        var text = $mck_text_box.html();
                        var tab_draft = {
                            'text': text
                        };
                        if ($mck_file_box.hasClass('vis')) {
                            tab_draft.fileMetas = FILE_METAS;
                            tab_draft.filelb = $file_name.html();
                            tab_draft.filesize = $file_size.html();
                        }
                        TAB_MESSAGE_DRAFT[currUserId] = tab_draft;
                    } else {
                        delete TAB_MESSAGE_DRAFT[currUserId];
                    }
                }
                _this.clearMessageField();
                _this.addDraftMessage(userId);
                $mck_msg_error.html("");
                $mck_msg_error.removeClass('vis').addClass('n-vis');
                $mck_response_text.html("");
                $mck_msg_response.removeClass('vis').addClass('n-vis');
                $mck_msg_form[0].reset();
                $mck_msg_inner.html("");
                $modal_footer_content.removeClass('vis').addClass('n-vis');
                $mck_add_new.removeClass('n-vis').addClass('vis');
                $mck_sidebox_search.removeClass('vis').addClass('n-vis');
                $mck_sidebox_content.removeClass('n-vis').addClass('vis');
                $mck_loading.removeClass('vis').addClass('n-vis');
                mckMessageService.loadMessageList(userId);
                _this.openConversation();
            };
            _this.processMessageList = function (data, scroll) {
                var showMoreDateTime;
                if (typeof data.message.length === "undefined") {
                    _this.addMessage(data.message, false, scroll);
                    showMoreDateTime = data.createdAtTime;
                } else {
                    $applozic.each(data.message, function (i, data) {
                        if (!(typeof data.to === "undefined")) {
                            _this.addMessage(data, false, scroll);
                            showMoreDateTime = data.createdAtTime;
                        }
                    });
                }
                $mck_show_more.data('datetime', showMoreDateTime);
            };
            _this.addTooltip = function (msgKeyString) {
                $applozic("." + msgKeyString + " .mck-icon-time").attr('title', 'pending');
                $applozic("." + msgKeyString + " .mck-btn-trash").attr('title', 'delete');
                $applozic("." + msgKeyString + " .mck-icon-ok-circle").attr('title', 'sent');
                $applozic("." + msgKeyString + " .mck-btn-forward").attr('title', 'forward message');
                $applozic("." + msgKeyString + " .mck-icon-delivered").attr('title', 'delivered');
                $applozic("." + msgKeyString + " .msgtype-outbox-cr").attr('title', 'sent via Carrier');
                $applozic("." + msgKeyString + " .msgtype-outbox-mck").attr('title', 'sent');
                $applozic("." + msgKeyString + " .msgtype-inbox-cr").attr('title', 'received via Carrier');
                $applozic("." + msgKeyString + " .msgtype-inbox-mck").attr('title', 'recieved');
            };
            _this.getIcon = function (msgType) {
                var sHTML = "";
                switch (msgType) {
                    case 0 :
                        sHTML = '<i class="icon-mail-forward msgtype-inbox msgtype-inbox-cr via-cr"></i> ';
                        break;
                    case 4 :
                        sHTML = '<i class="icon-mail-forward msgtype-inbox msgtype-inbox-mck via-mck"></i> ';
                        break;
                    case 6 :
                        sHTML = '<i class ="icon-phone call_incoming"></i> ';
                        break;
                    case 7 :
                        sHTML = '<i class ="icon-phone call_outgoing"></i> ';
                        break;
                    case 5 :
                        sHTML = '<i class="icon-reply msgtype-outbox msgtype-outbox-mck via-mck"></i> ';
                        break;
                    case 1 :
                    case 3 :
                        sHTML = '<i class="icon-reply msgtype-outbox msgtype-outbox-cr via-cr"></i> ';
                        break;
                }
                return sHTML;
            };
            _this.getContact = function (contactId) {
                if (typeof MCK_CONTACT_MAP[contactId] === 'object') {
                    return  MCK_CONTACT_MAP[contactId];
                } else {
                    return;
                }
            };
            _this.getContactDisplayName = function (userId) {
                if (typeof MCK_CONTACT_NAME_MAP[userId] === 'string') {
                    return  MCK_CONTACT_NAME_MAP[userId];
                } else {
                    return;
                }
            };
            _this.addMessage = function (msg, append, scroll) {
                if (msg.type === 6 || msg.type === 7) {
                    return;
                }
                var individual = true;
                if ($applozic("#mck-message-cell ." + msg.keyString).length > 0) {
                    return;
                }
                if ($applozic("#mck-message-cell .mck-no-data-text").length > 0) {
                    $applozic(".mck-no-data-text").remove();
                }
                var messageClass = "";
                var floatWhere = "mck-msg-right";
                var statusIcon = "mck-icon-time";
                var contactExpr = "vis";
                if (msg.type === 0 || msg.type === 4 || msg.type === 6) {
                    floatWhere = "mck-msg-left";
                }
                statusIcon = _this.getStatusIconName(msg);
                var replyId = msg.keyString;
                var replyMessageParameters = "'" + msg.deviceKeyString + "'," + "'" + msg.to + "'" + ",'" + msg.contactIds + "'" + ",'" + replyId + "'";
                var contactIds = msg.contactIds;
                var toNumbers = msg.to;
                if (contactIds.lastIndexOf(",") === contactIds.length - 1) {
                    contactIds = contactIds.substring(0, contactIds.length - 1);
                }
                if (toNumbers.lastIndexOf(",") === toNumbers.length - 1) {
                    toNumbers = toNumbers.substring(0, toNumbers.length - 1);
                }
                var contactIdsArray = contactIds.split(",");
                var tos = toNumbers.split(",");
                var contactNames = '';
                var s = new Set();
                if (contactIdsArray.length > 0 && contactIdsArray[0]) {
                    for (var i = 0; i < contactIdsArray.length; i++) {
                        var contact = _this.getContact('' + contactIdsArray[i]);
                        if (typeof contact === 'undefined') {
                            var contactId = contactIdsArray[i];
                            _this.createContact(contactId);
                        }
                        if (typeof contact !== 'undefined') {
                            var name = contact.displayName;
                            var rel = contact.rel;
                            rel = (typeof rel === 'undefined') || rel.length === 0 ? "" : ' [' + rel + ']';
                            var contactNumber = "";
                            if (individual === false) {
                                contactNumber = tos[i];
                            }
                            messageClass += contact.htmlId;
                            if (individual === false) {
                                contactNumber += rel;
                                contactNames = contactNames + ' ' + name + '<br/>';
                            } else {
                                contactExpr = "n-vis";
                            }
                            s.add(tos[i]);
                        }
                    }
                }
                var msgFeatExpr = "n-vis";
                var fileName = "";
                var fileSize = "";
                var frwdMsgExpr = msg.message;
                if (typeof msg.fileMetas !== "undefined") {
                    if (typeof msg.fileMetas.length === "undefined") {
                        fileName = msg.fileMetas.name;
                        fileSize = msg.fileMetas.size;
                    } else {
                        fileName = msg.fileMetas[0].name;
                        fileSize = msg.fileMetas[0].size;
                    }
                }
                var msgList = [
                    {
                        msgKeyExpr: msg.keyString,
                        msgDeliveredExpr: msg.delivered,
                        msgSentExpr: msg.sent,
                        msgCreatedAtTime: msg.createdAtTime,
                        msgTypeExpr: msg.type,
                        msgSourceExpr: msg.source,
                        statusIconExpr: statusIcon,
                        contactExpr: contactExpr,
                        contactIdsExpr: contactIds,
                        msgFloatExpr: floatWhere,
                        contactNamesExpr: contactNames,
                        replyIdExpr: replyId,
                        createdAtTimeExpr: mckDateUtils.getDate(msg.createdAtTime),
                        msgFeatExpr: msgFeatExpr,
                        replyMessageParametersExpr: replyMessageParameters,
                        msgClassExpr: messageClass,
                        msgExpr: frwdMsgExpr,
                        selfDestructTimeExpr: msg.timeToLive,
                        fileMetaKeyExpr: msg.fileMetaKeyStrings,
                        fileExpr: _this.getImagePath(msg),
                        fileNameExpr: fileName,
                        fileSizeExpr: fileSize
                    }
                ];
                append ? $applozic.tmpl("messageTemplate", msgList).appendTo("#mck-message-cell .mck-message-inner") : $applozic.tmpl("messageTemplate", msgList).prependTo("#mck-message-cell .mck-message-inner");
                var msg_text = msg.message.replace(/\n/g, '<br/>');
                var emoji_template = w.emoji.replace_unified(msg_text);
                emoji_template = w.emoji.replace_colons(emoji_template);
                var $textMessage = $applozic("." + replyId + " .mck-msg-content");
                $textMessage.html(emoji_template);
                if (msg.type === 6 || msg.type === 7) {
                    $textMessage.html(_this.getIcon(msg.type) + $textMessage.html());
                    (msg.type === 6) ? $textMessage.addClass("call_incoming") : $textMessage.addClass('call_outgoing');
                }
                $textMessage.linkify({
                    target: '_blank'
                });
                if (msg.fileMetaKeyStrings) {
                    $applozic("." + replyId + " .mck-file-text" + " a").trigger('click');
                    $applozic("." + replyId + " .mck-file-text").removeClass('n-vis').addClass('vis');
                    if ($textMessage.html() === "") {
                        $textMessage.removeClass('vis').addClass('n-vis');
                    }
                }
                if (scroll) {
                    $mck_msg_inner.animate({
                        scrollTop: $mck_msg_inner.prop("scrollHeight")
                    }, 0);
                }
                if ($mck_top_btn_panel.hasClass('n-vis')) {
                    $mck_top_btn_panel.removeClass('n-vis').addClass('vis');
                    $mck_msg_inner.addClass('mck-msg-w-panel');
                }
                _this.addTooltip(msg.keyString);
                _this.messageContextMenu(msg.keyString);
            };
            _this.getDisplayNameFromMessage = function (message) {
                var contact = this.getContact('' + message.contactIds.split(",")[0]);
                var name = "";
                if (typeof contact === "undefined") {
                    name = message.to;
                    contact = mckMessageLayout.createContact('' + message.contactIds.split(",")[0]);
                } else {
                    name = (typeof contact.displayName === "undefined") ? contact.value : contact.displayName;
                }
                return name;
            };
            _this.getImagePath = function (msg) {
                if (msg.fileMetaKeyStrings && typeof msg.fileMetas !== "undefined") {
                    if (typeof msg.fileMetas.length === "undefined") {
                        if (msg.fileMetas.contentType.indexOf("image") !== -1) {
                            if (msg.fileMetas.contentType.indexOf("svg") !== -1) {
                                return '<a href="#" role="link" class="file-preview-link fancybox-media fancybox"><img src="' + MCK_BASE_URL + FILE_PREVIEW_URL + msg.fileMetaKeyStrings + '" area-hidden="true" data-imgurl="' + MCK_BASE_URL + FILE_PREVIEW_URL + msg.fileMetaKeyStrings + '"></img></a>';
                            } else {
                                return '<a href="#" role="link" class="file-preview-link fancybox-media fancybox"><img src="' + msg.fileMetas.thumbnailUrl + '" area-hidden="true" data-imgurl="' + MCK_BASE_URL + FILE_PREVIEW_URL + msg.fileMetaKeyStrings + '"></img></a>';
                            }
                        } else {
                            return '<a href="' + MCK_BASE_URL + FILE_PREVIEW_URL + '"' + msg.fileMetaKeyStrings + '" role="link" class="file-preview-link" target="_blank"><span class="file-detail"><span class="mck-file-name"><img src="' + MCK_BASE_URL + '/resources/sidebox/images/ic_action_attachment.png" alt="File">&nbsp;' + msg.fileMetas.name + '</span>&nbsp;<span class="file-size">' + mckFileService.getFilePreviewSize(msg.fileMetas.size) + '</span></span></a>';
                        }
                    } else {
                        if (msg.fileMetas[0].contentType.indexOf("image") !== -1) {
                            if (msg.fileMetas[0].contentType.indexOf("svg") !== -1) {
                                return '<a href="#" role="link" class="file-preview-link fancybox-media fancybox"><img src="' + MCK_BASE_URL + FILE_PREVIEW_URL + msg.fileMetaKeyStrings + '" area-hidden="true" data-imgurl="' + MCK_BASE_URL + FILE_PREVIEW_URL + msg.fileMetaKeyStrings + '"></img></a>';
                            } else {
                                return '<a href="#" role="link" class="file-preview-link fancybox-media fancybox"><img src="' + msg.fileMetas[0].thumbnailUrl + '" area-hidden="true" data-imgurl="' + MCK_BASE_URL + FILE_PREVIEW_URL + msg.fileMetaKeyStrings + '"></img></a>';
                            }
                        } else {
                            return '<a href="' + MCK_BASE_URL + FILE_PREVIEW_URL + msg.fileMetaKeyStrings + '" role="link" class="file-preview-link" target="_blank"><span class="file-detail"><span class="mck-file-name"><img src="' + MCK_BASE_URL + '/resources/sidebox/images/ic_action_attachment.png" alt="File">&nbsp;' + msg.fileMetas[0].name + '</span>&nbsp;<span class="file-size">' + mckFileService.getFilePreviewSize(msg.fileMetas[0].size) + '</span></span></a>';
                        }
                    }
                }
                return "";
            };
            _this.getContactImageLink = function (contact) {
                var imgsrctag = "";
                if (typeof (MCK_GETUSERIMAGE) === "function") {
                    var imgsrc = MCK_GETUSERIMAGE(contact.value);
                    if (imgsrc && typeof imgsrc !== 'undefined') {
                        imgsrctag = '<img src="' + imgsrc + '"/>';
                    }
                }
                if (!imgsrctag) {
                    if (contact.photoSrc !== "") {
                        imgsrctag = '<img src="' + contact.photoSrc + '"/>';
                    } else if (contact.photoLink === "") {
                        var displayName = _this.getContactDisplayName(contact.value);
                        if (!displayName) {
                            displayName = contact.displayName;
                        }
                        imgsrctag = _this.getContactImageByAlphabet(displayName);
                    } else {
                        imgsrctag = '<img src="' + MCK_BASE_URL + '/contact.image?photoLink=' + contact.photoLink + '"/>';
                    }
                }
                return imgsrctag;
            };
            _this.getContactImageByAlphabet = function (name) {
                if (typeof name === 'undefined' || name === "") {
                    return '<div class="mck-alpha-contact-image mck-alpha-user"><span class="mck-contact-icon"><img src="' + MCK_BASE_URL + USER_ICON_URL + '" alt=""></span></div>';
                }
                var first_alpha = name.charAt(0);
                var letters = /^[a-zA-Z]+$/;
                if (first_alpha.match(letters)) {
                    first_alpha = first_alpha.toUpperCase();
                    return '<div class="mck-alpha-contact-image alpha_' + first_alpha + '"><span class="mck-contact-icon">' + first_alpha + '</span></div>';
                } else {
                    return '<div class="mck-alpha-contact-image alpha_user"><span class="mck-contact-icon"><img src="' + MCK_BASE_URL + USER_ICON_URL + '" alt=""></span></div>';
                }
            };
            _this.addContactsFromMessageList = function (data) {
                if (data + '' === "null") {
                    return;
                } else {
                    $mck_msg_inner.html('<ul id="mck-contact-list" class=" mck-contact-list mck-nav mck-nav-tabs mck-nav-stacked"></ul>');
                    if (typeof data.message.length === "undefined") {
                        _this.addContactsFromMessage(data.message);
                    } else {
                        $applozic.each(data.message, function (i, data) {
                            if (!(typeof data.to === "undefined")) {
                                _this.addContactsFromMessage(data, true);
                            }
                        });
                    }
                }
            };
            _this.createContact = function (contactId) {
                var displayName = _this.getContactDisplayName(contactId);
                if (typeof displayName === 'undefined') {
                    displayName = contactId;
                }
                var contact = {
                    'contactId': contactId,
                    'htmlId': mckContactUtils.formatContactId(contactId),
                    'displayName': contactId,
                    'name': contactId + " <" + contactId + ">" + " [" + "Main" + "]",
                    'value': contactId,
                    'rel': '',
                    'photoLink': '',
                    'photoSrc': '',
                    'email': '',
                    'unsaved': true,
                    'appVersion': null
                };
                MCK_CONTACT_MAP[contactId] = contact;
                return contact;
            };
            _this.createContactWithDetail = function (data) {
                var displayName = data.displayName;
                var contactId = data.userId;
                if (!displayName) {
                    displayName = _this.getContactDisplayName(contactId);
                }
                if (typeof displayName === 'undefined') {
                    displayName = contactId;
                } else {
                    MCK_CONTACT_NAME_MAP[contactId] = displayName;
                }
                var contact = {
                    'contactId': contactId,
                    'htmlId': mckContactUtils.formatContactId(contactId),
                    'displayName': displayName,
                    'name': contactId + " <" + contactId + ">" + " [" + "Main" + "]",
                    'value': contactId,
                    'rel': '',
                    'photoLink': '',
                    'photoSrc': data.photoLink,
                    'email': '',
                    'unsaved': true,
                    'appVersion': null
                };
                MCK_CONTACT_MAP[contactId] = contact;
                return contact;
            };
            _this.updateContactDetail = function (contact, data) {
                var displayName = data.displayName;
                var contactId = data.userId;
                if (!displayName) {
                    displayName = _this.getContactDisplayName(contactId);
                }
                if (typeof displayName === 'undefined') {
                    displayName = contactId;
                } else {
                    MCK_CONTACT_NAME_MAP[contactId] = displayName;
                }
                contact.displayName = displayName;
                contact.photoLink = data.photoLink;
                MCK_CONTACT_MAP[contactId] = contact;
                return contact;
            };
            _this.addContactsFromMessage = function (message, update) {
                var data = message;
                var contactIdsArray = _this.getuserIdFromMessage(data);
                if (contactIdsArray.length > 0 && contactIdsArray[0]) {
                    for (var i = 0; i < contactIdsArray.length; i++) {
                        var contact = _this.getContact('' + contactIdsArray[i]);
                        if (typeof contact === 'undefined') {
                            var contactId = contactIdsArray[i];
                            contact = _this.createContact(contactId);
                        }
                        _this.updateRecentConversationList(contact, data, update);
                    }
                }
            };
            _this.updateRecentConversationList = function (contact, message, update) {
                if ($applozic("#mck-contact-list #li-" + contact.htmlId).length > 0) {
                    var $mck_msg_part = $applozic("#mck-contact-list #li-" + contact.htmlId + " .mck-cont-msg-wrapper");
                    if (($mck_msg_part.is(":empty") || update) && message !== undefined) {
                        _this.updateContact(contact, message);
                    }
                } else {
                    _this.addContact(contact, "mck-contact-list", message);
                }
            };
            _this.addContactsToSearchList = function (userIdArray, isLocal) {
                $mck_search_loading.removeClass('n-vis').addClass('vis');
                if (isLocal) {
                    for (var i = 0; i < MCK_CONTACT_ARRAY.length; i++) {
                        var contact = MCK_CONTACT_ARRAY[i];
                        userIdArray.push(contact.userId);
                    }
                }
                userIdArray.sort();
                $applozic("#mck-search-list").html('');
                for (var j = 0; j < userIdArray.length; j++) {
                    var userId = userIdArray[j];
                    if (typeof userId !== 'undefined') {
                        var contact = _this.getContact('' + userId);
                        if (typeof contact === 'undefined') {
                            contact = _this.createContact(userId);
                        }
                        if ($applozic("#mck-search-list #li-" + contact.htmlId).length === 0) {
                            _this.addContact(contact, "mck-search-list");
                        }
                    }
                }
                $mck_search_loading.removeClass('vis').addClass('n-vis');
            };
            _this.removeContact = function (contact) {
                $applozic("#li-" + contact.htmlId).remove();
            };
            _this.updateContact = function (contact, message) {
                var $contactElem = $applozic("#li-" + contact.htmlId);
                var currentMessageTime = $contactElem.data('msg-time');
                if (message && message.createdAtTime > currentMessageTime) {
                    var emoji_template = _this.getMessageTextForContactPreview(message);
                    $applozic("#li-" + contact.htmlId + " .mck-cont-msg-date").html(typeof message.createdAtTime === 'undefined' ? "" : mckDateUtils.getTimeOrDate(message ? message.createdAtTime : "", true));
                    $applozic("#li-" + contact.htmlId + " .mck-cont-msg-wrapper").html(message ? emoji_template : "");
                    var latestCreatedAtTime = $applozic('#mck-contact-list li:nth-child(1)').data('msg-time');
                    $contactElem.data('msg-time', message.createdAtTime);
                    if ((typeof latestCreatedAtTime === "undefined" || (message ? message.createdAtTime : "") >= latestCreatedAtTime) && $applozic("#mck-contact-list li").index($contactElem) !== 0) {
                        $applozic('#mck-contact-list li:nth-child(1)').before($contactElem);
                    }
                }
            };
            _this.clearContactMessageData = function (userId) {
                var htmlId = mckContactUtils.formatContactId(userId);
                $applozic("#li-" + htmlId + " .mck-cont-msg-date").html("");
                $applozic("#li-" + htmlId + " .mck-cont-msg-wrapper").html("");
            };
            _this.addContact = function (contact, $listId, message) {
                var emoji_template = _this.getMessageTextForContactPreview(message);
                var displayName = "";
                if (typeof (MCK_GETUSERNAME) === "function") {
                    displayName = MCK_GETUSERNAME(contact.value);
                }
                if (!displayName) {
                    displayName = _this.getContactDisplayName(contact.value);
                }
                if (!displayName) {
                    displayName = contact.displayName;
                }
                contact.displayName = displayName;
                var imgsrctag = _this.getContactImageLink(contact);
                var prepend = false;
                var olStatus = "n-vis";
                if (IS_MCK_OL_STATUS && w.MCK_OL_MAP[contact.value]) {
                    olStatus = "vis";
                    prepend = true;
                }
                var contactList = [
                    {
                        contHtmlExpr: contact.htmlId,
                        contIdExpr: contact.value,
                        msgCreatedAtTimeExpr: message ? message.createdAtTime : "",
                        mckLauncherExpr: MCK_LAUNCHER,
                        contImgExpr: imgsrctag,
                        contOlExpr: olStatus,
                        contNameExpr: displayName,
                        msgCreatedDateExpr: message ? mckDateUtils.getTimeOrDate(message.createdAtTime, true) : "",
                        msgTextExpr: message ? emoji_template : ""
                    }
                ];
                var latestCreatedAtTime = $applozic('#' + $listId + ' li:nth-child(1)').data('msg-time');
                if (typeof latestCreatedAtTime === "undefined" || (message ? message.createdAtTime : "") > latestCreatedAtTime || ($listId.indexOf("search") !== -1 && prepend)) {
                    $applozic.tmpl("contactTemplate", contactList).prependTo('#' + $listId);
                } else {
                    $applozic.tmpl("contactTemplate", contactList).appendTo('#' + $listId);
                }
            };
            _this.loadContacts = function (data) {
                if (data + '' === "null" || typeof data === "undefined" || typeof data.contacts === "undefined" || data.contacts.length === 0) {
                    return;
                }
                if (typeof data.contacts.length === "undefined") {
                    if ((typeof data.contacts.userId !== "undefined")) {
                            data = data.contacts;
                            var contact = _this.getContact('' + data.userId);
                            if (typeof contact === 'undefined') {
                                _this.createContactWithDetail(data);
                            } else {
                                _this.updateContactDetail(contact, data);
                            }
                            MCK_CONTACT_ARRAY.push(data);
                        }
                } else {
                    MCK_CONTACT_ARRAY.length = 0;
                    $applozic.each(data.contacts, function (i, data) {
                        if ((typeof data.userId !== "undefined")) {
                            var contact = _this.getContact('' + data.userId);
                            if (typeof contact === 'undefined') {
                                _this.createContactWithDetail(data);
                            } else {
                                _this.updateContactDetail(contact, data);
                            }
                            MCK_CONTACT_ARRAY.push(data);
                        }
                    });
                }
            };
            _this.getStatusIcon = function (msg) {
                return '<i class="' + _this.getStatusIconName(msg) + ' move-right ' + msg.keyString + '_status status-icon"></i>';
            };
            _this.getStatusIconName = function (msg) {
                if (msg.type === 7 || msg.type === 6) {
                    return "";
                }
                if (msg.delivered === "true" || msg.delivered === true) {
                    return 'mck-icon-delivered';
                }
                if (msg.type === 3 || (msg.type === 1 && msg.source === 0) || ((msg.sent === "true" || msg.sent === true) && msg.type !== 0 && msg.type !== 4)) {
                    return 'mck-icon-ok-circle';
                }
                if (msg.type === 5 || (msg.type === 1 && (msg.source === 1 || msg.source === 2))) {
                    return 'mck-icon-ok-circle';
                }
                return "";
            };
            _this.clearMessageField = function () {
                $mck_text_box.html("");
                $mck_msg_sbmt.attr('disabled', false);
                $mck_file_box.removeClass('vis').addClass('n-vis');
                $mck_text_box.removeClass('mck-text-wf');
                $mck_textbox_container.removeClass('mck-text-req');
                $mck_textbox_container.removeClass('mck-textbox-container-wf');
                $mck_text_box.attr("required", "");
            };
            _this.addDraftMessage = function (userId) {
                if ((typeof userId !== 'undefined') && typeof TAB_MESSAGE_DRAFT[userId] === 'object') {
                    var draftMessage = TAB_MESSAGE_DRAFT[userId];
                    $mck_text_box.html(draftMessage.text);
                    if (draftMessage.fileMetas || draftMessage.filelb) {
                        if (draftMessage.fileMetas) {
                            $file_progress.removeClass('vis').addClass('n-vis');
                            $mck_msg_sbmt.attr('disabled', false);
                            $file_remove.attr("disabled", false);
                        } else {
                            $file_progress.removeClass('n-vis').addClass('vis');
                            $mck_msg_sbmt.attr('disabled', true);
                            $file_remove.attr("disabled", true);
                        }
                        FILE_METAS = draftMessage.fileMetas;
                        $file_name.html(draftMessage.filelb);
                        $file_size.html(draftMessage.filesize);
                        $mck_file_box.removeClass('n-vis').addClass('vis');
                        $mck_text_box.addClass('mck-text-wf');
                        $mck_textbox_container.removeClass('mck-text-req');
                        $mck_textbox_container.addClass('mck-textbox-container-wf');
                        $mck_text_box.removeAttr('required');
                    }
                } else {
                    FILE_METAS = "";
                }
            };
            _this.removeConversationThread = function (userId) {
                mckStorage.clearMckMessageArray();
                var contact = _this.getContact(userId);
                var currentTabId = $mck_msg_inner.data('mck-id');
                if (typeof currentTabId === 'undefined' || currentTabId === '') {
                    if (typeof contact !== 'undefined') {
                        $applozic("#li-" + contact.htmlId).remove();
                    } else {
                        userId = mckContactUtils.formatContactId(userId);
                        $applozic("#li-" + userId).remove();
                    }
                } else if (currentTabId === userId) {
                    $mck_msg_inner.html("");
                    $mck_msg_cell.removeClass('n-vis').addClass('vis');
                    $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                    $mck_msg_inner.removeClass('mck-msg-w-panel');
                }
            };
            _this.removedDeletedMessage = function (keyString, userId) {
                mckStorage.clearMckMessageArray();
                var $divMessage = $applozic("." + keyString);
                if ($divMessage.length > 0) {
                    $divMessage.remove();
                    if ($mck_msg_inner.is(":empty")) {
                        $mck_msg_cell.removeClass('n-vis').addClass('vis');
                        $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                        $mck_msg_inner.removeClass('mck-msg-w-panel');
                    }
                } else if (typeof userId !== "undefined") {
                    var mckContactListLength = $applozic("#mck-contact-list").length;
                    if (mckContactListLength > 0) {
                        mckMessageService.updateContactList(userId);
                    }
                }
            };
            _this.getMessageTextForContactPreview = function (message) {
                if (typeof message !== 'undefined') {
                    if (message.message) {
                        var emoji_template = w.emoji.replace_unified(message.message);
                        emoji_template = w.emoji.replace_colons(emoji_template);
                        if (emoji_template.indexOf('</span>') !== -1) {
                            emoji_template = emoji_template.substring(0, emoji_template.lastIndexOf('</span>'));
                        } else {
                            emoji_template = emoji_template.substring(0, 15);
                        }
                        return emoji_template;
                    } else if (message.fileMetaKeyStrings && typeof message.fileMetas !== "undefined") {
                        if (typeof message.fileMetas.length === "undefined") {
                            if (message.fileMetas.contentType.indexOf("image") !== -1) {
                                return '<img class="mck-icon-camera" src="' + MCK_BASE_URL + '/resources/sidebox/images/icon-camera.png" alt="Image"> image';
                            } else {
                                return '<img src="' + MCK_BASE_URL + '/resources/sidebox/images/ic_action_attachment.png" alt="Image"> file';
                            }
                        } else {
                            if (message.fileMetas[0].contentType.indexOf("image") !== -1) {
                                return '<img class="mck-icon-camera" src="' + MCK_BASE_URL + '/resources/sidebox/images/icon-camera.png" alt="Image"> image';
                            } else {
                                return '<img src="' + MCK_BASE_URL + '/resources/sidebox/images/ic_action_attachment.png" alt="Image"> file';
                            }
                        }
                    }
                }
                return "";
            };
            _this.getuserIdFromMessage = function (message) {
                var contactIds = message.contactIds;
                if (contactIds.lastIndexOf(",") === contactIds.length - 1) {
                    contactIds = contactIds.substring(0, contactIds.length - 1);
                }
                return contactIds.split(",");
            };
            _this.getUserIdArrayFromMessageList = function (messages) {
                var userIdArray = new Array();
                if (typeof messages.message.length === "undefined") {
                    userIdArray.concat(_this.getuserIdFromMessage(messages.message));
                } else {
                    $applozic.each(messages.message, function (i, data) {
                        if (!(typeof data.to === "undefined")) {
                            userIdArray = userIdArray.concat(_this.getuserIdFromMessage(data));
                        }
                    });
                }
                return userIdArray;
            };
            _this.messageContextMenu = function (messageKey) {
                var $messageBox = $applozic("." + messageKey + " .mck-msg-box");
                if ($messageBox.addEventListener) {
                    $messageBox.addEventListener('contextmenu', function (e) {
                        e.preventDefault();
                    }, false);
                } else {
                    $messageBox.bind('contextmenu', function (e) {
                        e.preventDefault();
                        $applozic(".mck-context-menu").removeClass("vis").addClass("n-vis");
                        $applozic("." + messageKey + " .mck-context-menu").removeClass("n-vis").addClass("vis");
                        w.event.returnValue = false;
                    });
                }
            };
            _this.updateDraftMessage = function (userId, file) {
                var tab_draft = {
                    'text': ""
                };
                if ((typeof userId !== 'undefined') && typeof TAB_MESSAGE_DRAFT[userId] === 'object') {
                    tab_draft = TAB_MESSAGE_DRAFT[userId];
                }
                if (typeof file === 'object') {
                    tab_draft.fileMetas = file.metas;
                    tab_draft.filelb = file.name;
                    tab_draft.filesize = file.size;
                }
                TAB_MESSAGE_DRAFT[userId] = tab_draft;
            };
        }

        function MckContactService() {
            var _this = this;
            var $mck_sidebox_search = $applozic("#mck-sidebox-search");
            var $mck_search_loading = $applozic("#mck-search-loading");
            var $mck_search_inner =$applozic("#mck-search-cell .mck-message-inner");
            var CONTACT_NAME_URL = "/rest/ws/user/v1/info";
            var CONTACT_LIST_URL = "/rest/ws/user/v1/ol/list";
            _this.getContactDisplayName = function (userIdArray) {
                var mckContactNameArray = [];
                if (userIdArray.length > 0 && userIdArray[0]) {
                    var data = "";
                    var uniqueUserIdArray = userIdArray.filter(function (item, pos) {
                        return userIdArray.indexOf(item) === pos;
                    });
                    for (var i = 0; i < uniqueUserIdArray.length; i++) {
                        var userId = uniqueUserIdArray[i];
                        if (typeof MCK_CONTACT_NAME_MAP[userId] === 'undefined') {
                            data += "userIds=" + userId + "&";
                        }
                    }
                    if (data.lastIndexOf("&") === data.length - 1) {
                        data = data.substring(0, data.length - 1);
                    }
                    if (data) {
                        $applozic.ajax({
                            url: MCK_BASE_URL + CONTACT_NAME_URL,
                            data: data,
                            global: false,
                            async: false,
                            type: 'get',
                            headers: {
                                "UserId-Enabled": true,
                                'Authorization': "Basic " + AUTH_CODE,
                                'Application-Key': APPLICATION_ID
                            },
                            success: function (data) {
                                for (var userId in data) {
                                    if (data.hasOwnProperty(userId)) {
                                        mckContactNameArray.push([userId, data[userId]]);
                                        MCK_CONTACT_NAME_MAP[userId] = data[userId];
                                        var contact = mckMessageLayout.getContact(userId);
                                        if (typeof contact !== 'undefined') {
                                            contact.displayName = data[userId];
                                        }
                                    }
                                }
                                mckStorage.updateMckContactNameArray(mckContactNameArray);
                            },
                            error: function () {
                            }
                        });
                    }
                }
            };
            _this.loadContacts = function () {
                $mck_search_loading.removeClass('n-vis').addClass('vis');
                $applozic("#mck-search-list").html('');
                var userIdArray = [];
                $applozic.ajax({
                    url: MCK_BASE_URL + CONTACT_LIST_URL + "?startIndex=0&pageSize=20",
                    type: 'get',
                    global: false,
                    success: function (data) {
                        $mck_search_loading.removeClass('vis').addClass('n-vis');
                        if ($mck_sidebox_search.hasClass('vis')) {
                            for (var userId in data) {
                                if (data.hasOwnProperty(userId)) {
                                    w.MCK_OL_MAP[userId] = data[userId] === 'true';
                                    userIdArray.push(userId);
                                }
                            }
                            _this.getContactDisplayName(userIdArray);
                            if (userIdArray !== null && userIdArray.length > 0) {
                                mckMessageLayout.addContactsToSearchList(userIdArray, false);
                            } else {
                                $mck_search_inner.html('<div class="mck-no-data-text mck-text-muted">No contacts yet!</div>');
                            }
                        }
                    },
                    error: function () {
                        $mck_search_loading.removeClass('vis').addClass('n-vis');
                        alert('Unable to process your request.');
                    }
                });
            };
        }

        function MckStorage() {
            var _this = this;
            var MCK_MESSAGE_ARRAY = [];
            var MCK_CONTACT_NAME_ARRAY = [];
            _this.getMckMessageArray = function () {
                if (typeof (w.sessionStorage) !== "undefined") {
                    return   $applozic.parseJSON(w.sessionStorage.getItem("mckMessageArray"));
                } else {
                    return  MCK_MESSAGE_ARRAY;
                }
            };
            _this.clearMckMessageArray = function () {
                if (typeof (w.sessionStorage) !== "undefined") {
                    w.sessionStorage.removeItem("mckMessageArray");
                } else {
                    MCK_MESSAGE_ARRAY.length = 0;
                }
            };
            _this.setMckMessageArray = function (messages) {
                if (typeof (w.sessionStorage) !== "undefined") {
                    w.sessionStorage.setItem('mckMessageArray', w.JSON.stringify(messages));
                } else {
                    MCK_MESSAGE_ARRAY = messages;
                }
            };
            _this.updateMckMessageArray = function (mckMessageArray) {
                if (typeof (w.sessionStorage) !== "undefined") {
                    var mckLocalMessageArray = $applozic.parseJSON(w.sessionStorage.getItem('mckMessageArray'));
                    if (mckLocalMessageArray !== null) {
                        mckMessageArray = mckMessageArray.concat(mckLocalMessageArray);
                    }
                    w.sessionStorage.setItem('mckMessageArray', w.JSON.stringify(mckMessageArray));
                    return  mckMessageArray;
                } else {
                    MCK_MESSAGE_ARRAY = MCK_MESSAGE_ARRAY.concat(mckMessageArray);
                    return MCK_MESSAGE_ARRAY;
                }
            };
            _this.getMckContactNameArray = function () {
                if (typeof (w.localStorage) !== "undefined") {
                    return $applozic.parseJSON(w.localStorage.getItem("mckContactNameArray"));
                } else {
                    return MCK_CONTACT_NAME_ARRAY;
                }
            };
            _this.setMckContactNameArray = function (mckContactNameArray) {
                if (typeof (w.sessionStorage) !== "undefined") {
                    w.localStorage.setItem('mckContactNameArray', w.JSON.stringify(mckContactNameArray));
                } else {
                    MCK_CONTACT_NAME_ARRAY = mckContactNameArray;
                }
            };
            _this.updateMckContactNameArray = function (mckContactNameArray) {
                if (typeof (w.sessionStorage) !== "undefined") {
                    var mckLocalcontactNameArray = $applozic.parseJSON(w.localStorage.getItem('mckContactNameArray'));
                    if (mckLocalcontactNameArray !== null) {
                        mckContactNameArray = mckContactNameArray.concat(mckLocalcontactNameArray);
                    }
                    w.localStorage.setItem('mckContactNameArray', w.JSON.stringify(mckContactNameArray));
                    return mckContactNameArray;
                } else {
                    MCK_CONTACT_NAME_ARRAY = MCK_CONTACT_NAME_ARRAY.concat(mckContactNameArray);
                    return  MCK_CONTACT_NAME_ARRAY;
                }
            };
        }

        function MckFileService() {
            var _this = this;
            var $file_name = $applozic(".mck-file-lb");
            var $file_size = $applozic(".mck-file-sz");
            var $file_box = $applozic("#mck-file-box");
            var $file_upload = $applozic("#mck-file-up");
            var $mck_msg_sbmt = $applozic("#mck-msg-sbmt");
            var $mck_text_box = $applozic("#mck-text-box");
            var $file_progress = $applozic("#mck-file-box .progress");
            var $textbox_container = $applozic("#mck-textbox-container");
            var $file_remove = $applozic("#mck-file-box .mck-remove-file");
            var $file_progressbar = $applozic("#mck-file-box .progress .bar");
            var $mck_msg_inner = $applozic("#mck-message-cell .mck-message-inner");
            var FILE_UPLOAD_URL = "/rest/ws/file/url";
            var FILE_PREVIEW_URL = "/rest/ws/file/shared/";
            var FILE_DELETE_URL = "/rest/ws/file/delete/file/meta";
            var ONE_MB = 1048576;
            var ONE_KB = 1024;
            _this.init = function () {
                $file_upload.fileupload({
                    previewMaxWidth: 100,
                    previewMaxHeight: 100,
                    previewCrop: true,
                    add: function (e, data) {
                        var uploadErrors = [];
                        if (data.originalFiles[0]['size'] > (MCK_FILEMAXSIZE * ONE_MB)) {
                            uploadErrors.push("file size can not be more than " + MCK_FILEMAXSIZE + " MB");
                        }
                        if (uploadErrors.length > 0) {
                            alert(uploadErrors.toString());
                        } else {
                            data.submit();
                        }
                    },
                    submit: function (e, data) {
                        if (FILE_METAS !== "") {
                            _this.deleteFileMeta(FILE_METAS);
                            FILE_METAS = "";
                        }
                        $mck_text_box.addClass('mck-text-wf');
                        $textbox_container.addClass('mck-textbox-container-wf');
                        $file_name.html('<a href="#">' + data.files[0].name + '</a>');
                        $file_size.html(_this.getFilePreviewSize(data.files[0].size));
                        $file_progressbar.css('width', '0%');
                        $file_progress.removeClass('n-vis').addClass('vis');
                        $file_remove.attr("disabled", true);
                        $file_box.removeClass('n-vis').addClass('vis');
                        if (data.files[0].name === $applozic("#mck-file-box .mck-file-lb a").html()) {
                            var currTab = $mck_msg_inner.data('mck-id');
                            var uniqueId = data.files[0].name + data.files[0].size;
                            TAB_FILE_DRAFT[uniqueId] = currTab;
                            $mck_msg_sbmt.attr('disabled', true);
                            $applozic.ajax({
                                type: "GET",
                                url: MCK_BASE_URL + FILE_UPLOAD_URL,
                                global: false,
                                data: "data=" + new Date().getTime(),
                                crosDomain: true,
                                headers: {
                                    "UserId-Enabled": true,
                                    'Authorization': "Basic " + AUTH_CODE,
                                    'Application-Key': APPLICATION_ID
                                },
                                success: function (result) {
                                    data.url = result;
                                    $file_upload.fileupload('send', data);
                                },
                                error: function () {
                                }
                            });
                        }
                        return false;
                    },
                    progressall: function (e, data) {
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        $file_progressbar.css(
                                'width',
                                progress + '%'
                                );
                    },
                    success: function (result) {
                        var fileExpr = _this.getFilePreviewPath(result, $applozic("#mck-file-box .mck-file-lb a").html());
                        var file_metas = "";
                        var name = "";
                        var size = "";
                        if (typeof result.fileMeta.length === "undefined") {
                            file_metas = result.fileMeta.keyString;
                            name = result.fileMeta.name;
                            size = result.fileMeta.size;
                        } else {
                            name = result.fileMeta[0].name;
                            size = result.fileMeta[0].size;
                            $applozic.each(result.fileMeta, function (i, fileMeta) {
                                file_metas += fileMeta.keyString + ",";

                            });
                        }
                        var currTabId = $mck_msg_inner.data('mck-id');
                        var uniqueId = name + size;
                        var fileTabId = TAB_FILE_DRAFT[uniqueId];
                        if (fileTabId !== currTabId) {
                            var file = {
                                'metas': file_metas,
                                'name': _this.getFilePreviewPath(result, name),
                                'size': _this.getFilePreviewSize(size)
                            };
                            mckMessageLayout.updateDraftMessage(fileTabId, file);
                            delete TAB_FILE_DRAFT[uniqueId];
                            return;
                        }
                        $file_remove.attr("disabled", false);
                        $mck_msg_sbmt.attr('disabled', false);
                        delete TAB_FILE_DRAFT[uniqueId];
                        $file_name.html(fileExpr);
                        $file_progress.removeClass('vis').addClass('n-vis');
                        $mck_text_box.addClass('mck-text-wf');
                        $textbox_container.addClass('mck-textbox-container-wf');
                        $file_box.removeClass('n-vis').addClass('vis');
                        $mck_text_box.removeAttr('required');
                        FILE_METAS = file_metas;
                        return false;
                    },
                    error: function () {
                        FILE_METAS = "";
                        $file_remove.trigger('click');
                    }
                });
            };
            $file_remove.on("click", function () {
                $file_name.html("");
                $file_size.html("");
                $mck_msg_sbmt.attr('disabled', false);
                $file_box.removeClass('vis').addClass('n-vis');
                $mck_text_box.removeClass('mck-text-wf');
                $textbox_container.removeClass('mck-textbox-container-wf');
                $mck_text_box.attr("required", "");
                if (FILE_METAS !== "") {
                    _this.deleteFileMeta(FILE_METAS);
                    FILE_METAS = "";
                }
            });
            _this.deleteFileMeta = function (fileMetaKeyString) {
                $applozic.ajax({
                    url: MCK_BASE_URL + FILE_DELETE_URL,
                    data: 'fileMetaKeyString=' + fileMetaKeyString,
                    global: false,
                    type: 'get',
                    success: function () {
                    },
                    error: function () {
                    }
                });
            };
            _this.getFilePreviewPath = function (result, fileName) {
                var name = (fileName) ? fileName : "file_attached";
                if (typeof result.fileMeta.length === "undefined") {
                    return '<a href="' + FILE_PREVIEW_URL + result.fileMeta.keyString + '" target="_blank">' + name + '</a>';
                }
                return "";
            };
            _this.getFilePreviewSize = function (fileSize) {
                if (fileSize) {

                    if (fileSize > ONE_MB) {
                        return "(" + parseInt(fileSize / ONE_MB) + " MB)";
                    } else if (fileSize > ONE_KB) {
                        return "(" + parseInt(fileSize / ONE_KB) + " KB)";
                    } else {
                       return "(" + parseInt(fileSize) + " B)";
                    }
                }
                return "";
            };
        }

        function MckNotificationService() {
            var _this = this;
            var $mck_sidebox;
            var $mck_msg_preview;
            var $mck_preview_icon;
            var $mck_preview_name;
            var notificationTimeout;
            var $mck_sidebox_launcher;
            var $mck_preview_msg_content;
            var $mck_preview_file_content;
            _this.init = function () {
                $mck_sidebox = $applozic("#mck-sidebox");
                $mck_msg_preview = $applozic("#mck-msg-preview");
                $mck_sidebox_launcher = $applozic("#mck-sidebox-launcher");
                $mck_preview_icon = $applozic("#mck-msg-preview .mck-preview-icon");
                $mck_preview_name = $applozic("#mck-msg-preview .mck-preview-cont-name");
                $mck_preview_msg_content = $applozic("#mck-msg-preview .mck-preview-msg-content");
                $mck_preview_file_content = $applozic("#mck-msg-preview .mck-preview-file-content");
                notificationTimeout = 60;
            };
            _this.getChannelToken = function () {
                $applozic.ajax({
                    url: MCK_BASE_URL + '/rest/ws/channel/getToken',
                    type: 'get',
                    global: false,
                    headers: {
                        "UserId-Enabled": true,
                        'Authorization': "Basic " + AUTH_CODE,
                        'Application-Key': APPLICATION_ID
                    },
                    success: function (data) {
                        if (data === "error") {
                            alert("Unable to process your request. Please try refreshing the page.");
                        } else {
                            mckInitializeChannel.reInitializeChannel(data);
                        }
                    },
                    error: function () {
                    }
                });
            };
            _this.isChrome = function () {
                return /chrom(e|ium)/.test(w.navigator.userAgent.toLowerCase());
            };
            _this.notifyUser = function (message) {
                var notificationTimeout = 60;
                if (message.type === 7) {
                    return;
                }
                _this.showNewMessageNotification(message);
                if (IS_MCK_NOTIFICATION && !MCK_TEXTBOX_FOCUSED) {
                    var name = mckMessageLayout.getDisplayNameFromMessage(message);
                    if (_this.isChrome()) {
                        var c_version = parseInt(w.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
                        if (c_version >= 35) {
                            if (!w.Notification) {
                                return;
                            }
                            if (w.Notification.permission !== "granted") {
                                w.Notification.requestPermission();
                            }
                            var notification = new w.Notification(name, {
                                body: message.message
                            });
                            notification.onclick = function () {
                                w.focus();
                                this.close();
                            };
                            setTimeout(function () {
                                notification.close();
                            }, notificationTimeout * 1000);
                        } else {
                            if (typeof w.webkitNotifications === "undefined") {
                                _this.showNewMessageNotification(message);
                                return;
                            }
                            if (w.webkitNotifications.checkPermission() === 0) {
                                var notification = w.webkitNotifications.createNotification(name, message.message);
                                _this.showNotification(notification);
                            }
                        }
                    } else {
                        if (typeof w.webkitNotifications === "undefined") {
                            _this.showNewMessageNotification(message);
                            return;
                        }
                        if (w.webkitNotifications.checkPermission() === 0) {
                            var notification = w.webkitNotifications.createNotification("/favicon.ico", name, message.message);
                            _this.showNotification(notification);
                        }
                    }
                }
            };
            _this.showNewMessageNotification = function (message) {
                if ($mck_sidebox.css('display') === 'none') {
                    var contact = mckMessageLayout.getContact('' + message.contactIds.split(",")[0]);
                    if (typeof contact === 'undefined') {
                        contact = mckMessageLayout.createContact('' + message.contactIds.split(",")[0]);
                    }
                    var imgsrctag = mckMessageLayout.getContactImageLink(contact);
                    if (typeof message !== 'undefined') {
                        var emoji_template = w.emoji.replace_unified(message.message);
                        emoji_template = w.emoji.replace_colons(emoji_template);
                    }
                    var msg = message ? emoji_template : "";
                    $mck_preview_msg_content.html(msg);
                    $mck_preview_msg_content.removeClass('n-vis').addClass('vis');
                    if (message.fileMetaKeyStrings) {
                        var preview_img_path = mckMessageLayout.getImagePath(message);
                        $mck_preview_file_content.html(preview_img_path);
                        $mck_preview_file_content.removeClass('n-vis').addClass('vis');
                        if ($mck_preview_msg_content.html() === "") {
                            $mck_preview_msg_content.removeClass('vis').addClass('n-vis');
                        }
                    }
                    $mck_preview_name.html(contact.displayName);
                    $mck_preview_icon.html(imgsrctag);
                    $mck_msg_preview.data('mck-id', contact.contactId);
                    $mck_sidebox_launcher.addClass('mck-sidebox-launcher-with-preview');
                    $mck_msg_preview.show();
                    setTimeout(function () {
                        $mck_msg_preview.fadeOut(3000);
                        $mck_sidebox_launcher.removeClass('mck-sidebox-launcher-with-preview');
                    }, 10000);
                }
            };
            _this.showNotification = function (notification) {
                if (_this.isChrome()) {
                    notification.onclick = function () {
                        w.focus();
                        this.cancel();
                    };
                }
                notification.show();
                setTimeout(function () {
                    notification.cancel();
                }, notificationTimeout * 1000);
            };
        }

        function MckInitializeChannel(token) {
            var _this = this;
            var channel = new w.goog.appengine.Channel(token), socket = channel.open(), connected = false;
            _this.reInitializeChannel = function (newToken) {
                channel = new w.goog.appengine.Channel(newToken);
                socket = channel.open();
                connected = false;
            };
            _this.isConnected = function () {
                return connected;
            };
            socket.onopen = function () {
                connected = true;
            };
            socket.onmessage = function (response) {
                var data = response.data;
                var resp = $applozic.parseJSON(data);
                var messageType = resp.type;
                if (messageType === "DELETE_SMS_CONTACT") {
                    var userId = resp.message;
                    if (typeof userId !== 'undefined') {
                        mckMessageLayout.removeConversationThread(userId);
                    }
                } else if (messageType === "SMS_DELETED") {
                    var keyString = resp.message.split(",")[0];
                    var userId = resp.message.split(",")[1];
                    mckMessageLayout.removedDeletedMessage(keyString, userId);
                } else if (messageType === "SMS_DELIVERED_UPDATE") {
                    $applozic("." + resp.message.split(",")[0] + " .mck-message-status").removeClass('mck-icon-time').removeClass('mck-icon-ok-circle').addClass('mck-icon-delivered');
                } else if (messageType.indexOf("SMS") !== -1) {
                    var message = $applozic.parseJSON(resp.message);
                    var userIdArray = mckMessageLayout.getuserIdFromMessage(message);
                    mckContactService.getContactDisplayName(userIdArray);
                    //  mckMessageLayout.openConversation();
                    var mckContactListLength = $applozic("#mck-contact-list").length;
                    var $mck_sidebox_content = $applozic("#mck-sidebox-content");
                    var userId = $applozic("#mck-message-cell .mck-message-inner").data('mck-id');
                    if ($mck_sidebox_content.hasClass('vis')) {
                        if (mckContactListLength === 0 && (typeof userId === "undefined" || userId === "")) {
                            var messageArray = [];
                            messageArray.push(message);
                            mckMessageLayout.addContactsFromMessageList({
                                message: messageArray
                            });
                        }
                        if (mckContactListLength > 0) {
                            mckMessageLayout.addContactsFromMessage(message, true);
                            if (messageType === "SMS_RECEIVED" && resp.notifyUser) {
                                mckNotificationService.notifyUser(message);
                                mckMessageService.updateDeliveryStatus(message);
                            }
                        } else {
                            if (messageType === "SMS_RECEIVED") {
                                var contactId = message.contactIds.replace(",", "");
                                var contact = mckMessageLayout.getContact(contactId);
                                if (typeof contact === 'undefined') {
                                    contact = mckMessageLayout.createContact(contactId);
                                }
                                if (typeof contact !== 'undefined') {
                                    if (typeof userId !== 'undefined' && userId === contact.contactId) {
                                        mckMessageLayout.addMessage(message, true, true);
                                        //Todo: use contactNumber instead of contactId for Google Contacts API.
                                    }
                                    if (resp.notifyUser) {
                                        mckNotificationService.notifyUser(message);
                                    }
                                    mckMessageService.updateDeliveryStatus(message);
                                }
                            } else if (messageType === "SMS_SENDING") {
                                if ((message.type !== 5 || message.source !== 1 || message.fileMetaKeyStrings)) {
                                    if (mckContactListLength > 0) {
                                        mckMessageLayout.addContactsFromMessage(message, true);
                                    } else {
                                        var contactIds = message.contactIds;
                                        if (contactIds.lastIndexOf(",") === contactIds.length - 1) {
                                            contactIds = contactIds.substring(0, contactIds.length - 1);
                                        }
                                        var contactIdsArray = contactIds.split(",");
                                        for (var i = 0; i < contactIdsArray.length; i++) {
                                            var contact = mckMessageLayout.getContact(contactIdsArray[i]);
                                            if (typeof contact === 'undefined') {
                                                contact = mckMessageLayout.createContact(contactIdsArray[i]);
                                            }
                                            if (typeof contact !== 'undefined') {
                                                if (typeof userId !== 'undefined' && userId === contact.contactId) {
                                                    mckMessageLayout.addMessage(message, true, true);
                                                    if (message.type === 3 || (message.type === 5 && message.fileMetaKeyStrings)) {
                                                        $applozic("." + message.keyString + " .mck-message-status").removeClass('mck-icon-time').addClass('mck-icon-ok-circle');
                                                        mckMessageLayout.addTooltip(message.keyString);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if (messageType === "SMS_SENT_UPDATE" && message.type !== 0 && message.type !== 4) {
                                $applozic("." + message.keyString + " .mck-message-status").removeClass('mck-icon-time').addClass('mck-icon-ok-circle');
                                mckMessageLayout.addTooltip(message.keyString);
                            }
                        }
                    }
                    mckStorage.clearMckMessageArray();
                }
            };
            socket.onerror = function () {
                mckNotificationService.getChannelToken();
            };
            socket.onclose = function () {
                connected = false;
            };
        }

        function MckDateUtils() {
            var _this = this;
            var fullDateFormat = "mmm d, h:MM TT";
            var onlyDateFormat = "mmm d";
            var onlyTimeFormat = "h:MM TT";
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            _this.getDate = function (createdAtTime) {
                var date = new Date(parseInt(createdAtTime, 10));
                var localDate = new Date();
                var utcTime = parseInt(date.getTime() + (localDate.getTimezoneOffset() * 60000));
                date = new Date(parseInt(utcTime + parseInt(MCK_USER_TIMEZONEOFFSET, 10)));
                var currentDate = new Date();
                var utcCurrentTime = parseInt(currentDate.getTime() + (localDate.getTimezoneOffset() * 60000));
                currentDate = new Date(parseInt(utcCurrentTime + parseInt(MCK_USER_TIMEZONEOFFSET, 10)));
                return currentDate.getDate() !== date.getDate() ? dateFormat(date, fullDateFormat, false) : dateFormat(date, onlyTimeFormat, false);
            };
            _this.getTimeOrDate = function (createdAtTime, timeFormat) {
                var date = new Date(parseInt(createdAtTime, 10));
                var localDate = new Date();
                var utcTime = parseInt(date.getTime() + (localDate.getTimezoneOffset() * 60000));
                date = new Date(parseInt(utcTime + parseInt(MCK_USER_TIMEZONEOFFSET, 10)));
                var currentDate = new Date();
                var utcCurrentTime = parseInt(currentDate.getTime() + (localDate.getTimezoneOffset() * 60000));
                currentDate = new Date(parseInt(utcCurrentTime + parseInt(MCK_USER_TIMEZONEOFFSET, 10)));
                if (timeFormat) {
                    return currentDate.getDate() !== date.getDate() ? dateFormat(date, onlyDateFormat, false) : dateFormat(date, onlyTimeFormat, false);
                } else {
                    return dateFormat(date, fullDateFormat, false);
                }
            };
            _this.getSystemDate = function (time) {
                var date = new Date(parseInt(time, 10));
                return dateFormat(date, fullDateFormat, false);
            };
            var dateFormat = function () {
                var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
                        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
                        timezoneClip = /[^-+\dA-Z]/g,
                        pad = function (val, len) {
                            val = String(val);
                            len = len || 2;
                            while (val.length < len)
                                val = "0" + val;
                            return val;
                        };
                // Regexes and supporting functions are cached through closure
                return function (date, mask, utc) {
                    var dF = dateFormat;
                    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
                    if (arguments.length === 1 && Object.prototype.toString.call(date) === "[object String]" && !/\d/.test(date)) {
                        mask = date;
                        date = undefined;
                    }
                    // Passing date through Date applies Date.parse, if necessary
                    date = date ? new Date(date) : new Date;
                    if (isNaN(date))
                        throw SyntaxError("invalid date");
                    mask = String(mask);
                    // mask = String(dF.masks[mask] || mask || dF.masks["default"]);
                    // Allow setting the utc argument via the mask
                    if (mask.slice(0, 4) === "UTC:") {
                        mask = mask.slice(4);
                        utc = true;
                    }
                    var _ = utc ? "getUTC" : "get",
                            d = date[_ + "Date"](),
                            D = date[_ + "Day"](),
                            m = date[_ + "Month"](),
                            y = date[_ + "FullYear"](),
                            H = date[_ + "Hours"](),
                            M = date[_ + "Minutes"](),
                            s = date[_ + "Seconds"](),
                            L = date[_ + "Milliseconds"](),
                            o = utc ? 0 : date.getTimezoneOffset(),
                            flags = {
                                d: d,
                                dd: pad(d),
                                ddd: dF.i18n.dayNames[D],
                                dddd: dF.i18n.dayNames[D + 7],
                                m: m + 1,
                                mm: pad(m + 1),
                                mmm: dF.i18n.monthNames[m],
                                mmmm: dF.i18n.monthNames[m + 12],
                                yy: String(y).slice(2),
                                yyyy: y,
                                h: H % 12 || 12,
                                hh: pad(H % 12 || 12),
                                H: H,
                                HH: pad(H),
                                M: M,
                                MM: pad(M),
                                s: s,
                                ss: pad(s),
                                l: pad(L, 3),
                                L: pad(L > 99 ? Math.round(L / 10) : L),
                                t: H < 12 ? "a" : "p",
                                tt: H < 12 ? "am" : "pm",
                                T: H < 12 ? "A" : "P",
                                TT: H < 12 ? "AM" : "PM",
                                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
                            };
                    return mask.replace(token, function ($0) {
                        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
                    });
                };
            }();
            // Some common format strings
            dateFormat.masks = {
                "default": "mmm d, yyyy h:MM TT",
                fullDateFormat: "mmm d, yyyy h:MM TT",
                onlyDateFormat: "mmm d",
                onlyTimeFormat: "h:MM TT",
                mailDateFormat: "mmm d, yyyy",
                mediumDate: "mmm d, yyyy",
                longDate: "mmmm d, yyyy",
                fullDate: "dddd, mmmm d, yyyy",
                shortTime: "h:MM TT",
                mediumTime: "h:MM:ss TT",
                longTime: "h:MM:ss TT Z",
                isoDate: "yyyy-mm-dd",
                isoTime: "HH:MM:ss",
                isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
                isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
            };
            // Internationalization strings
            dateFormat.i18n = {
                dayNames: [
                    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
                ],
                monthNames: [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
                ]
            };
        }
    }
}($applozic, window, document));