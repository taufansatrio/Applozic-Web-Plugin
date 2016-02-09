var $applozic = jQuery.noConflict(true);
var $appModal = $applozic.fn.mckModal.noConflict();
$applozic.fn.mckModal = $appModal;
(function ($applozic, w, d) {
    "use strict";
    if (typeof String.prototype.startsWith !== 'function') {
        String.prototype.startsWith = function (str) {
            if (str === null)
                return false;
            var i = str.length;
            if (this.length < i)
                return false;
            for (--i; (i >= 0) && (this[i] === str[i]); --i)
                continue;
            return i < 0;
        };
    }

    var default_options = {
        baseUrl: "https://apps.applozic.com",
        fileBaseUrl: "https://applozic.appspot.com",
        launcher: "applozic-launcher",
        userId: null,
        appId: null,
        userName: null,
        supportId: null,
        mode: "standard",
        olStatus: false,
        desktopNotification: false,
        maxAttachmentSize: 25          //default size is 25MB
    };
    $applozic.fn.applozic = function (options, params) {
        var $mck_sidebox = $applozic('#mck-sidebox');
        if (typeof options.ojq !== 'undefined') {
            $ = options.ojq;
            jQuery = options.ojq;
        } else {
            $ = $applozic;
            jQuery = $applozic;
        }
        if (typeof options.obsm !== 'undefined') {
            $.fn.modal = options.obsm;
            jQuery.fn.modal = options.obsm;
        }
        if ($applozic.type(options) === "object") {
            options = $applozic.extend(true, {}, default_options, options);
        }
        var oInstance = undefined;
        if (typeof ($mck_sidebox.data("applozic_instance")) !== "undefined") {
            oInstance = $mck_sidebox.data("applozic_instance");
            if ($applozic.type(options) === "string") {
                switch (options) {
                    case "loadConvTab" :
                        oInstance.loadConvTab(params);
                        break;
                    case "loadTab" :
                        oInstance.loadTab(params);
                        break;
                    case "loadContacts" :
                        oInstance.loadContacts(params);
                        break;
                    case "sendMessage" :
                        return oInstance.sendMessage(params);
                }
            }
        } else {
            if (options.userId && options.appId && $applozic.trim(options.userId) !== "" && $applozic.trim(options.appId) !== "") {
                var applozic = new Applozic(options);
                applozic.init();
                $mck_sidebox.data("applozic_instance", applozic);
            } else {
                alert("Oops! looks like incorrect application id or user Id.");
            }
        }
    };
    $applozic.fn.applozic.defaults = default_options;
    function Applozic(options) {
        var _this = this;
        var MCK_BASE_URL = options.baseUrl;
        var MCK_FILE_URL = options.fileBaseUrl;
        var MCK_TOKEN;
        var MCK_WEBSOCKET_URL;
        var APPLICATION_ID = options.appId;
        var MCK_USER_ID = options.userId;
        var MCK_USER_NAME = options.userName;
        var USER_COUNTRY_CODE;
        var USER_DEVICE_KEY;
        var AUTH_CODE;
        var MCK_LAUNCHER = options.launcher;
        var MCK_PRICE_WIDGET_ENABLED = options.priceWidget;
        var IS_MCK_TOPIC_HEADER = (typeof options.topicHeader === "boolean") ? (options.topicHeader) : false;
        var IS_MCK_TOPIC_BOX = (typeof options.topicBox === "boolean") ? (options.topicBox) : false;
        var MCK_PRICE_DETAIL = options.finalPriceResponse;
        var MCK_ON_PLUGIN_CLOSE = options.onClose;
        var MCK_ON_PLUGIN_INIT = options.onInit;
        var MCK_CALLBACK = options.readConversation;
        var MCK_GETUSERNAME = options.contactDisplayName;
        var MCK_DISPLAY_TEXT = options.displayText;
        var MCK_GETUSERIMAGE = options.contactDisplayImage;
        var MCK_GETTOPICDETAIL = options.getTopicDetail;
        var MCK_MSG_VALIDATION = options.validateMessage;
        var IS_MCK_OL_STATUS = (typeof options.olStatus === "boolean") ? (options.olStatus) : false;
        var IS_MCK_TAB_FOCUSED = true;
        var MCK_SUPPORT_ID_DATA_ATTR = (options.supportId) ? ('data-mck-id="' + options.supportId + '"') : '';
        var MCK_MODE = options.mode;
        var MCK_USER_TIMEZONEOFFSET;
        var MCK_FILEMAXSIZE = options.maxAttachmentSize;
        var FILE_META = "";
        var ELEMENT_NODE = 1;
        var IS_MCK_NOTIFICATION = (typeof options.desktopNotification === "boolean") ? options.desktopNotification : false;
        var TEXT_NODE = 3;
        var TAGS_BLOCK = ['p', 'div', 'pre', 'form'];
        var MCK_CONTACT_MAP = [];
        var MCK_GROUP_MAP = [];
        var MCK_LAST_SEEN_AT_MAP = [];
        var MCK_CONVERSATION_MAP = [];
        var MCK_TOPIC_DETAIL_MAP = [];
        var TAB_MESSAGE_DRAFT = new Object();
        var TAB_FILE_DRAFT = new Object();
        var MCK_CONTACT_ARRAY = new Array();
        var MCK_CONTACT_NAME_MAP = new Array();
        var MCK_UNREAD_COUNT_MAP = new Array();
        var MCK_TAB_CONVERSATION_MAP = new Array();
        var mckStorage = new MckStorage();
        var mckUtils = new MckUtils();
        var mckMessageService = new MckMessageService();
        var mckGroupService = new MckGroupService();
        var mckContactService = new MckContactService();
        var mckFileService = new MckFileService();
        var mckMessageLayout = new MckMessageLayout();
        var mckGroupLayout = new MckGroupLayout();
        var mckContactUtils = new MckContactUtils();
        var mckDateUtils = new MckDateUtils();
        var mckNotificationService = new MckNotificationService();
        w.MCK_OL_MAP = new Array();
        _this.getOptions = function () {
            return options;
        };
        _this.init = function () {
            mckMessageService.init();
            mckFileService.init();
            mckUtils.initializeApp(options);
            mckNotificationService.init();
            $applozic("#mck-text-box").emojiarea({button: "#mck-btn-smiley",
                wysiwyg: true,
                menuPosition: 'top'});
        };
        _this.loadTab = function (tabId) {
            mckMessageLayout.loadTab({tabId: tabId, 'isGroup': false});
            $applozic("#mck-search").val("");
        };
        _this.loadConvTab = function (optns) {
            if (typeof optns === 'object' && optns.userId && optns.convId) {
                mckMessageLayout.loadTab({tabId: optns.userId, conversationId: optns.convId, 'isGroup': false});
            }
        };
        _this.loadContacts = function (contacts) {
            mckMessageLayout.loadContacts(contacts);
        };
        _this.sendMessage = function (params) {
            if (typeof params === "object") {
                var to = params.to;
                var message = params.message;
                if (typeof to === 'undefined' || to === "") {
                    return "To Field Required";
                }
                if (typeof message === 'undefined' || message === "") {
                    return "Message Field Required";
                }
                message = $applozic.trim(message);
                var messagePxy = {
                    "to": to,
                    "type": 5,
                    "contentType": 0,
                    "message": message
                };
                mckMessageService.sendMessage(messagePxy);
                return "success";
            } else {
                return "Unsupported Format. Please check format";
            }
        };
        function MckUtils() {
            var _this = this;
            var INITIALIZE_APP_URL = "/tab/initialize.page";
            _this.getLauncherHtml = function () {
                return '<div id="mck-sidebox-launcher" class="mck-sidebox-launcher">' +
                        '<a href="#" class="applozic-launcher mck-button-launcher" ' + (MCK_MODE === 'support' ? MCK_SUPPORT_ID_DATA_ATTR : '') + '></a></div>' +
                        '<div id="mck-msg-preview" class="mck-msg-preview applozic-launcher">' +
                        '<div class="mck-row">' +
                        '<div class="blk-lg-3 mck-preview-icon"></div>' +
                        '<div class="blk-lg-9">' +
                        '<div class="mck-row mck-truncate mck-preview-content">' +
                        '<strong class="mck-preview-cont-name"></strong></div>' +
                        '<div class="mck-row mck-preview-content">' +
                        '<div class="mck-preview-msg-content"></div>' +
                        '<div class="mck-preview-file-content mck-msg-text notranslate blk-lg-12 mck-attachment n-vis"></div>' +
                        '</div></div></div></div>';
            };
            _this.initializeApp = function (options) {
                var data = "applicationId=" + options.appId + "&userId=" + options.userId;
                if (MCK_USER_NAME !== null) {
                    data += "&userName=" + options.userName;
                }
                $applozic.ajax({
                    url: MCK_BASE_URL + INITIALIZE_APP_URL + "?" + data,
                    type: 'get',
                    headers: {'Application-Key': APPLICATION_ID},
                    success: function (result) {
                        if (result === "INVALID_APPID" || result === "error") {
                            alert("Oops! looks like incorrect application id or user id.");
                            return;
                        }
                        result = $applozic.parseJSON(result);
                        if (result.token) {
                            MCK_TOKEN = result.token;
                            USER_COUNTRY_CODE = result.countryCode;
                            USER_DEVICE_KEY = result.deviceKey;
                            MCK_WEBSOCKET_URL = result.websocketUrl;
                            MCK_USER_TIMEZONEOFFSET = result.timeZoneOffset;
                            MCK_FILE_URL = result.fileBaseUrl;
                            AUTH_CODE = btoa(result.userId + ":" + result.deviceKey);
                            $applozic.ajaxPrefilter(function (options) {
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
                            if (result.betaPackage) {
                                var poweredByUrl = "https://www.applozic.com/?utm_source=" + w.location.href + "&utm_medium=webplugin&utm_campaign=poweredby";
                                $applozic(".mck-running-on a").attr('href', poweredByUrl);
                                $applozic(".mck-running-on").removeClass("n-vis").addClass('vis');
                            }
                            //$applozic("." + MCK_LAUNCHER).removeClass("hide");
                            new MckInitializeChannel(MCK_WEBSOCKET_URL, MCK_TOKEN);
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
                            mckGroupService.loadGroups();
                            if (typeof MCK_ON_PLUGIN_INIT === "function") {
                                MCK_ON_PLUGIN_INIT("success");
                            }
                        } else {
                            w.console.log("Unable to initiate app. Please reload page.");
                            if (typeof MCK_ON_PLUGIN_INIT === "function") {
                                MCK_ON_PLUGIN_INIT("error");
                            }
                        }
                    },
                    error: function () {
                        w.console.log('Unable to initialize app. Please reload page.');
                        if (typeof MCK_ON_PLUGIN_INIT === "function") {
                            MCK_ON_PLUGIN_INIT("error");
                        }
                    }
                });
                $applozic(w).focus(function () {
                    IS_MCK_TAB_FOCUSED = true;
                });
                $applozic(w).blur(function () {
                    IS_MCK_TAB_FOCUSED = false;
                });
                $applozic(d).on("click", ".fancybox", function (e) {
                    var href = $applozic(this).find('img').data('imgurl');
                    $applozic(this).fancybox({
                        'openEffect': 'none',
                        'closeEffect': 'none',
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
            _this.textVal = function ($element) {
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
                var children = $element.childNodes;
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
                    return evt.clientX + (d.documentElement.scrollLeft ? d.documentElement.scrollLeft : d.body.scrollLeft);
                } else {
                    return null;
                }
            };
            _this.mouseY = function (evt) {
                if (evt.pageY) {
                    return evt.pageY;
                } else if (evt.clientY) {
                    return evt.clientY + (d.documentElement.scrollTop ? d.documentElement.scrollTop : d.body.scrollTop);
                } else {
                    return null;
                }
            };
        }

        function MckMessageService() {
            var _this = this;
            var $mck_search = $applozic("#mck-search");
            var $mck_msg_to = $applozic("#mck-msg-to");
            var $mck_msg_new = $applozic("#mck-msg-new");
            var $mck_sidebox = $applozic("#mck-sidebox");
            var $mck_file_box = $applozic("#mck-file-box");
            var $mck_text_box = $applozic("#mck-text-box");
            var $mck_msg_form = $applozic("#mck-msg-form");
            var $mck_msg_sbmt = $applozic("#mck-msg-sbmt");
            var $mck_tab_title = $applozic("#mck-tab-title");
            var $mck_msg_error = $applozic("#mck-msg-error");
            var $mck_show_more = $applozic("#mck-show-more");
            var $mck_tab_status = $applozic("#mck-tab-status");
            var $mck_msg_cell = $applozic("#mck-message-cell");
            var $mck_loading = $applozic("#mck-contact-loading");
            var $mck_msg_response = $applozic("#mck-msg-response");
            var $mck_form_field = $applozic("#mck-msg-form input");
            var $mck_response_text = $applozic("#mck_response_text");
            var $mck_top_btn_panel = $applozic("#mck-top-btn-panel");
            var $mck_price_text_box = $applozic("#mck-price-text-box");
            var $mck_sidebox_search = $applozic("#mck-sidebox-search");
            var $mck_show_more_icon = $applozic("#mck-show-more-icon");
            var $mck_sidebox_content = $applozic(".mck-sidebox-content");
            var $mck_contacts_content = $applozic("#mck-contacts-content");
            var $modal_footer_content = $applozic(".mck-box-ft .modal-form");
            var $mck_msg_inner = $applozic("#mck-message-cell .mck-message-inner");
            var $mck_search_inner = $applozic("#mck-search-cell .mck-message-inner");
            var MESSAGE_SEND_URL = "/rest/ws/message/send";
            var MESSAGE_LIST_URL = "/rest/ws/message/list";
            var TOPIC_ID_URL = "/rest/ws/conversation/topicId";
            var MESSAGE_DELETE_URL = "/rest/ws/message/delete";
            var CONVERSATION_ID_URL = "/rest/ws/conversation/id";
            var MESSAGE_READ_UPDATE_URL = "/rest/ws/message/read";
            var GROUP_MESSAGE_LIST_URL = "/rest/ws/message/group/list";
            var MESSAGE_DELIVERY_UPDATE_URL = "/rest/ws/message/delivered";
            var CONVERSATION_CLOSE_UPDATE_URL = "/rest/ws/conversation/close";
            var CONVERSATION_DELETE_URL = "/rest/ws/message/delete/conversation";
            var CONVERSATION_READ_UPDATE_URL = "/rest/ws/message/read/conversation";
            var offlineblk = '<div id="mck-ofl-blk" class="mck-m-b"><div class="mck-clear"><div class="blk-lg-12 mck-text-light mck-text-muted mck-test-center">${userIdExpr} is offline now</div></div></div>';
            $applozic.template("oflTemplate", offlineblk);
            $applozic(d).on("click", ".mck-message-delete", function () {
                _this.deleteMessage($applozic(this).parents('.mck-m-b').data("msgkey"));
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
                    $mck_contacts_content.removeClass('vis').addClass('n-vis');
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
                    if (confirm("Are you sure want to delete all the conversation!")) {
                        mckMessageService.deleteConversation();
                    }
                });
                $applozic(d).on("click", ".applozic-tm-launcher", function (e) {
                    e.preventDefault();
                    var tabId = $applozic(this).data("mck-id");
                    tabId = (typeof tabId !== "undefined" && tabId !== "") ? tabId.toString() : tabId;
                    var userName = $applozic(this).data("mck-name");
                    userName = (typeof userName !== "undefined" && userName !== "") ? userName.toString() : userName;
                    var supportId = $applozic(this).data("mck-supportid");
                    supportId = (typeof supportId !== "undefined" && supportId !== "") ? supportId.toString() : supportId;
                    var topicId = $applozic(this).data("mck-topicid");
                    topicId = (typeof topicId !== "undefined" && topicId !== "") ? topicId.toString() : "";
                    var msgText = $applozic(this).data("mck-msg");
                    msgText = (typeof msgText !== "undefined" && msgText !== "") ? msgText.toString() : "";
                    if (typeof (MCK_GETTOPICDETAIL) === "function" && topicId) {
                        var topicDetail = MCK_GETTOPICDETAIL(topicId);
                        if (typeof topicDetail === 'object' && topicDetail.title !== 'undefined') {
                            MCK_TOPIC_DETAIL_MAP[topicId] = topicDetail;
                        }
                    }
                    var params = {
                        'topicId': topicId,
                        'tabId': tabId,
                        'userName': userName,
                        'isMessage': true,
                        'msgText': msgText
                    };
                    if (supportId) {
                        params.isGroup = true;
                        params.supportId = supportId;
                        mckMessageService.getConversationId(params);
                    } else {
                        params.isGroup = false;
                        mckMessageLayout.loadTab(params, mckMessageService.sendTopicMessage);
                    }
                });
                $applozic(d).on("click", ".applozic-wt-launcher", function (e) {
                    e.preventDefault();
                    var tabId = $applozic(this).data("mck-id");
                    tabId = (typeof tabId !== "undefined" && tabId !== "") ? tabId.toString() : tabId;
                    var userName = $applozic(this).data("mck-name");
                    userName = (typeof userName !== "undefined" && userName !== "") ? userName.toString() : userName;
                    var topicId = $applozic(this).data("mck-topicid");
                    topicId = (typeof topicId !== "undefined" && topicId !== "") ? topicId.toString() : "";
                    if (typeof (MCK_GETTOPICDETAIL) === "function") {
                        var topicDetail = MCK_GETTOPICDETAIL(topicId);
                        if (typeof topicDetail === 'object' && topicDetail.title !== 'undefined') {
                            MCK_TOPIC_DETAIL_MAP[topicId] = topicDetail;
                        }
                    }
                    mckMessageService.getConversationId({'tabId': tabId, 'isGroup': false, 'userName': userName, 'topicId': topicId, 'isMessage': false});
                });
                $applozic(d).on("click", "." + MCK_LAUNCHER + ",.mck-conversation-tab-link, .mck-contact-list ." + MCK_LAUNCHER, function (e) {
                    e.preventDefault();
                    var $this = $applozic(this);
                    var tabId = $this.data("mck-id");
                    tabId = (typeof tabId !== "undefined" && tabId !== "") ? tabId.toString() : "";
                    var userName = $this.data("mck-name");
                    userName = (typeof userName !== "undefined" && userName !== "") ? userName.toString() : userName;
                    var topicId = $this.data("mck-topicid");
                    topicId = (typeof topicId !== "undefined" && topicId !== "") ? topicId.toString() : topicId;
                    var isGroup = ($this.data("isgroup") === true);
                    var conversationId = $this.data("mck-conversationid");
                    conversationId = (typeof conversationId !== "undefined" && conversationId !== "") ? conversationId.toString() : "";
                    mckMessageLayout.loadTab({'tabId': tabId, 'isGroup': isGroup, 'userName': userName, 'conversationId': conversationId, 'topicId': topicId});
                    $mck_search.val("");
                });
                $applozic(d).on("click", ".mck-close-sidebox", function (e) {
                    e.preventDefault();
                    $mck_sidebox.mckModal('hide');
                    var conversationId = $mck_msg_inner.data('mck-conversationid');
                    $mck_msg_inner.data("mck-id", "");
                    $mck_msg_inner.data("mck-topicid", "");
                    $mck_msg_inner.data("mck-name", "");
                    $mck_msg_inner.data('mck-conversationid', "");
                    if (conversationId) {
                        var conversationPxy = MCK_CONVERSATION_MAP[conversationId];
                        if (typeof conversationPxy === 'object') {
                            var topicId = conversationPxy.topicId;
                            if (typeof MCK_ON_PLUGIN_CLOSE === "function") {
                                MCK_ON_PLUGIN_CLOSE(MCK_USER_ID, topicId);
                            }
                        }
                    }
                });
                $applozic(d).on("click", ".mck-tab-search", function (e) {
                    e.preventDefault();
                    var tabId = $mck_search.val();
                    if (tabId !== "") {
                        mckMessageLayout.loadTab({tabId: tabId, isGroup: false});
                        $modal_footer_content.removeClass('n-vis').addClass('vis');
                    }
                    $mck_search.val("");
                });
                $applozic(d).on("click", ".mck-price-submit", function (e) {
                    e.preventDefault();
                    _this.sendPriceMessage();
                });
                $mck_price_text_box.keydown(function (event) {
                    if (event.keyCode === 13) {
                        _this.sendPriceMessage();
                    }
                });
                $mck_price_text_box.on('click', function (e) {
                    e.preventDefault();
                    $mck_price_text_box.removeClass('mck-text-req');
                });
                $applozic(d).on("click", ".mck-show-more", function (e) {
                    var $this = $applozic(this);
                    e.preventDefault();
                    var tabId = $this.data("tabId");
                    var isGroup = $mck_msg_inner.data('isgroup');
                    var startTime = $this.data('datetime');
                    mckMessageService.loadMessageList({'tabId': tabId, 'isGroup': isGroup, 'startTime': startTime});
                });
                $applozic(d).on("click", ".mck-accept", function (e) {
                    var conversationId = $applozic(this).data('mck-conversationid');
                    var priceText = $applozic(this).data('mck-topic-price');
                    if (typeof (MCK_PRICE_DETAIL) === 'function' && priceText && conversationId) {
                        var conversationPxy = MCK_CONVERSATION_MAP[conversationId];
                        var groupId = $mck_msg_to.val();
                        var supplierId = mckGroupLayout.getGroupDisplayName(groupId);
                        if (typeof conversationPxy === 'object') {
                            MCK_PRICE_DETAIL({custId: MCK_USER_ID, suppId: supplierId, productId: conversationPxy.topicId, price: priceText});
                            mckMessageService.sendConversationCloseUpdate(conversationId);
                        } else {
                            mckMessageService.getTopicId({'conversationId': conversationId, 'suppId': supplierId, 'priceText': priceText});
                        }
                    }
                });
                $mck_msg_form.submit(function () {
                    var message = $applozic.trim(mckUtils.textVal($mck_text_box[0]));
                    if ($mck_file_box.hasClass('n-vis') && FILE_META) {
                        FILE_META = "";
                    }
                    if (message.length === 0 && !FILE_META) {
                        $mck_text_box.addClass("mck-text-req");
                        return false;
                    }
                    if (typeof (MCK_MSG_VALIDATION) === 'function' && !MCK_MSG_VALIDATION(message)) {
                        return false;
                    }
                    var messagePxy = {
                        "type": 5,
                        "contentType": 0,
                        "message": message
                    };
                    var conversationId = $mck_msg_inner.data('mck-conversationid');
                    var topicId = $mck_msg_inner.data('mck-topicid');
                    if (conversationId) {
                        messagePxy.conversationId = conversationId;
                    } else if (topicId) {
                        var conversationPxy = {
                            'topicId': topicId
                        };
                        var topicDetail = MCK_TOPIC_DETAIL_MAP[topicId];
                        if (typeof topicDetail === "object") {
                            conversationPxy.topicDetail = w.JSON.stringify(topicDetail);
                        }
                        messagePxy.conversationPxy = conversationPxy;
                    }
                    if (FILE_META) {
                        messagePxy.fileMeta = FILE_META;
                    }
                    if ($mck_msg_inner.data("isgroup") === true) {
                        messagePxy.groupId = $mck_msg_to.val();
                    } else {
                        messagePxy.to = $mck_msg_to.val();
                    }
                    $mck_msg_sbmt.attr('disabled', true);
                    $mck_msg_error.removeClass('vis').addClass('n-vis');
                    $mck_msg_error.html("");
                    $mck_response_text.html("");
                    $mck_msg_response.removeClass('vis').addClass('n-vis');
                    return _this.sendMessage(messagePxy);
                });
                $mck_form_field.on('click', function () {
                    $applozic(this).val("");
                    $mck_msg_error.removeClass('vis').addClass('n-vis');
                    $mck_msg_response.removeClass('vis').addClass('n-vis');
                });
                $applozic(d).bind("click", function () {
                    $applozic(".mck-context-menu").removeClass("vis").addClass("n-vis");
                    $mck_text_box.removeClass('mck-text-req');
                });
            };
            $mck_search.keydown(function (event) {
                if (event.keyCode === 13) {
                    var tabId = $applozic(this).val();
                    if (tabId !== "") {
                        mckMessageLayout.loadTab({'tabId': tabId, 'isGroup': false});
                        $modal_footer_content.removeClass('n-vis').addClass('vis');
                    }
                    $applozic(this).val("");
                    return false;
                }
            });
            _this.sendMessage = function (messagePxy) {
                var randomId = mckUtils.randomId();
                var tabId = $mck_msg_inner.data('mck-id');
                var message = {
                    'to': messagePxy.to,
                    'groupId': messagePxy.groupId,
                    'deviceKey': messagePxy.deviceKey,
                    'type': 5,
                    'contentType': messagePxy.contentType,
                    'message': messagePxy.message,
                    'conversationId': messagePxy.conversationId,
                    'topicId': messagePxy.topicId,
                    'sendToDevice': true,
                    'createdAtTime': new Date().getTime(),
                    'key': randomId,
                    'storeOnDevice': true,
                    'sent': false,
                    'shared': false,
                    'read': true
                };
                if (!FILE_META) {
                    var isTopPanelAdded = false;
                    var contact = "";
                    if (message.groupId) {
                        contact = mckGroupLayout.getGroup(message.groupId);
                        if (typeof contact === "undefined") {
                            contact = mckGroupLayout.createGroup(message.groupId);
                        }
                    } else {
                        contact = mckMessageLayout.fetchContact(message.to);
                    }
                    if (typeof tabId !== "undefined" && tabId === contact.contactId) {
                        mckMessageLayout.addMessage(message, true, true, false);
                        if ($mck_top_btn_panel.hasClass('n-vis')) {
                            isTopPanelAdded = true;
                        }
                    }
                    $mck_msg_sbmt.attr('disabled', false);
                    $applozic("." + randomId + " .mck-message-status").removeClass('mck-icon-ok-circle').addClass('mck-icon-time');
                    mckMessageLayout.addTooltip(randomId);
                    if ($applozic("#mck-message-cell .mck-no-data-text").length > 0) {
                        $applozic(".mck-no-data-text").remove();
                    }
                    var $mck_msg_div = $applozic("#mck-message-cell .mck-message-inner div[name='message']." + randomId);
                    mckMessageLayout.clearMessageField();
                }
                if (messagePxy.conversationId) {
                    var conversationPxy = MCK_CONVERSATION_MAP[messagePxy.conversationId];
                    if (conversationPxy !== 'undefined' && conversationPxy.closed) {
                        if (typeof MCK_DISPLAY_TEXT === 'function') {
                            var displayText = MCK_DISPLAY_TEXT();
                            if (typeof displayText === 'object') {
                                var text = displayText.onConversationClose;
                            }
                        }
                        if (!text) {
                            text = 'Chat disabled with user';
                        }
                        $mck_msg_error.html(text);
                        $mck_msg_error.removeClass('n-vis').addClass('vis').addClass('mck-no-mb');
                        $mck_msg_form.addClass('n-vis');
                        return;
                    }
                }
                $applozic.ajax({
                    type: "POST",
                    url: MCK_BASE_URL + MESSAGE_SEND_URL,
                    global: false,
                    headers: {'Application-Key': APPLICATION_ID,
                        'Authorization': "Basic " + AUTH_CODE
                    },
                    data: w.JSON.stringify(messagePxy),
                    contentType: 'application/json',
                    success: function (data) {
                        if (typeof data === 'object') {
                            var messageKey = data.messageKey;
                            var conversationId = data.conversationId;
                            $mck_msg_inner.data('mck-conversationid', conversationId);
                            if (messagePxy.conversationPxy) {
                                var conversationPxy = messagePxy.conversationPxy;
                                MCK_CONVERSATION_MAP[conversationId] = conversationPxy;
                            }
                            if (!FILE_META) {
                                $mck_msg_div.removeClass(randomId).addClass(messageKey);
                                $mck_msg_div.data('msgkey', messageKey);
                                $applozic("." + messageKey + " .mck-message-status").removeClass('mck-icon-time').addClass('mck-icon-ok-circle').attr('title', 'sent');
                                mckMessageLayout.addTooltip(messageKey);
                            } else {
                                $mck_msg_sbmt.attr('disabled', false);
                                mckMessageLayout.clearMessageField();
                            }
                            if (isTopPanelAdded) {
                                $mck_show_more.data('datetime', data.createdAt);
                            }
                            mckMessageLayout.messageContextMenu(messageKey);
                        } else if (data === 'error') {
                            $mck_msg_sbmt.attr('disabled', false);
                            $mck_msg_error.html("Unable to process your request. Please try again");
                            $mck_msg_error.removeClass('n-vis').addClass('vis');
                            if (!FILE_META) {
                                $mck_msg_div.remove();
                                if (isTopPanelAdded) {
                                    $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                    $mck_msg_inner.removeClass('mck-msg-w-panel');
                                }
                            }
                        }
                        delete TAB_MESSAGE_DRAFT[tabId];
                        FILE_META = "";
                    },
                    error: function () {
                        $mck_msg_error.html('Unable to process your request. Please try again.');
                        $mck_msg_error.removeClass('n-vis').addClass('vis');
                        if (!FILE_META) {
                            $mck_msg_div.remove();
                            if (isTopPanelAdded) {
                                $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                $mck_msg_inner.removeClass('mck-msg-w-panel');
                            }
                        }
                        $mck_msg_sbmt.attr('disabled', false);
                        mckMessageLayout.clearMessageField();
                        FILE_META = "";
                    }
                });
                return false;
            };
            _this.deleteMessage = function (msgKey) {
                var userId = $mck_msg_inner.data('mck-id');
                if (typeof userId !== 'undefined') {
                    $applozic.ajax({
                        url: MCK_BASE_URL + MESSAGE_DELETE_URL + "?key=" + msgKey,
                        type: 'get',
                        success: function (data) {
                            if (data === 'success') {
                                $applozic("." + msgKey).remove();
                                mckStorage.clearMckMessageArray();
                                if ($mck_msg_inner.is(":empty")) {
                                    $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                    $mck_msg_inner.removeClass('mck-msg-w-panel');
                                }
                            } else {
                                w.console.log('Unable to delete message. Please reload page.');
                            }
                        }
                    });
                }
            };
            _this.deleteConversation = function () {
                var tabId = $mck_msg_inner.data('mck-id');
                var isGroup = $mck_msg_inner.data("isgroup");
                if (typeof tabId !== 'undefined') {
                    var data = (isGroup) ? "groupId=" + tabId : "userId=" + tabId;
                    $applozic.ajax({
                        type: "get",
                        url: MCK_BASE_URL + CONVERSATION_DELETE_URL,
                        global: false,
                        data: data,
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
            };
            _this.loadMessageList = function (params, callback) {
                var individual = false;
                var isConvReq = false;
                var reqData = "";
                if (typeof params.tabId !== "undefined" && params.tabId !== "") {
                    reqData = (params.isGroup) ? "&groupId=" + params.tabId : "&userId=" + params.tabId;
                    individual = true;
                    if (params.startTime) {
                        reqData += "&endTime=" + params.startTime;
                    }
                    if (params.conversationId) {
                        reqData += "&conversationId=" + params.conversationId;
                        if (typeof MCK_TAB_CONVERSATION_MAP[params.tabId] === 'undefined') {
                            isConvReq = true;
                            reqData += "&conversationReq=true";
                        } else {
                            mckMessageLayout.addConversationMenu(params.tabId, params.isGroup);
                        }
                    }
                }
                if (!params.startTime) {
                    $mck_msg_inner.html("");
                }
                $mck_loading.removeClass('n-vis').addClass('vis');
                $applozic.ajax({
                    url: MCK_BASE_URL + MESSAGE_LIST_URL + "?startIndex=0&pageSize=30" + reqData,
                    type: 'get',
                    global: false,
                    success: function (data) {
                        var isMessages = true;
                        var currUserId = $mck_msg_inner.data('mck-id');
                        if (params.tabId === currUserId) {
                            if (data + '' === "null" || typeof data.message === "undefined" || data.message.length === 0) {
                                isMessages = false;
                                if (individual) {
                                    if (params.startTime) {
                                        $mck_show_more_icon.removeClass('n-vis').addClass('vis');
                                        $mck_show_more_icon.fadeOut(3000, function () {
                                            $mck_show_more_icon.removeClass('vis').addClass('n-vis');
                                        });
                                    } else if ($applozic("#mck-message-cell .mck-message-inner div[name='message']").length === 0) {
                                        if (!MCK_PRICE_WIDGET_ENABLED) {
                                            $mck_msg_inner.removeClass('mck-msg-w-panel');
                                        }
                                        $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                                        $mck_msg_inner.html('<div class="mck-no-data-text mck-text-muted">No messages yet!</div>');
                                    }
                                } else {
                                    $mck_msg_inner.html('<div class="mck-no-data-text mck-text-muted">No conversations yet!</div>');
                                }
                            }
                            if (data + '' !== "null") {
                                if (individual) {
                                    //  w.MCK_OL_MAP[userId] = (data.userDetails.length > 0);
                                    if (isMessages) {
                                        if (params.startTime) {
                                            mckMessageLayout.processMessageList(data, false);
                                        } else {
                                            mckMessageLayout.processMessageList(data, true);
                                            $mck_top_btn_panel.removeClass('n-vis').addClass('vis');
                                            if (MCK_PRICE_WIDGET_ENABLED) {
                                                $mck_msg_inner.addClass('mck-msg-w-widget');
                                            } else {
                                                $mck_msg_inner.addClass('mck-msg-w-panel');
                                            }
                                            if (typeof (MCK_CALLBACK) === "function") {
                                                MCK_CALLBACK(params.tabId);
                                            }
                                        }
                                    }
                                    if (data.userDetails.length > 0) {
                                        $applozic.each(data.userDetails, function (i, userDetail) {
                                            if (!params.isGroup) {
                                                if (userDetail.connected === true) {
                                                    w.MCK_OL_MAP[userDetail.userId] = true;
                                                } else {
                                                    w.MCK_OL_MAP[userDetail.userId] = false;
                                                    if (typeof userDetail.lastSeenAtTime !== "undefined") {
                                                        MCK_LAST_SEEN_AT_MAP[userDetail.userId] = userDetail.lastSeenAtTime;
                                                    }
                                                }
                                            }
                                        });
                                    }
                                    MCK_UNREAD_COUNT_MAP[params.tabId] = 0;
                                    if (!params.isGroup && (w.MCK_OL_MAP[params.tabId] || MCK_LAST_SEEN_AT_MAP[params.tabId])) {
                                        if (w.MCK_OL_MAP[params.tabId]) {
                                            $mck_tab_status.html("Online");
                                        } else if (MCK_LAST_SEEN_AT_MAP[params.tabId]) {
                                            $mck_tab_status.html(mckDateUtils.getLastSeenAtStatus(MCK_LAST_SEEN_AT_MAP[params.tabId]));
                                        }
                                        $mck_tab_title.addClass("mck-tab-title-w-status");
                                        $mck_tab_status.removeClass('n-vis').addClass('vis');
                                    }
                                    if (data.conversationPxys.length > 0) {
                                        var tabConvArray = new Array();
                                        $applozic.each(data.conversationPxys, function (i, conversationPxy) {
                                            if (typeof conversationPxy === 'object') {
                                                tabConvArray.push(conversationPxy);
                                                MCK_CONVERSATION_MAP[conversationPxy.id] = conversationPxy;
                                                if (conversationPxy.topicDetail) {
                                                    MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId] = $applozic.parseJSON(conversationPxy.topicDetail);
                                                }
                                            }
                                        });
                                        if (isConvReq) {
                                            MCK_TAB_CONVERSATION_MAP[params.tabId] = tabConvArray;
                                            mckMessageLayout.addConversationMenu(params.tabId, params.isGroup);
                                        }
                                    }
                                    if (params.conversationId) {
                                        var conversationPxy = MCK_CONVERSATION_MAP[params.conversationId];
                                        if (conversationPxy.closed) {
                                            if (typeof MCK_DISPLAY_TEXT === 'function') {
                                                var displayText = MCK_DISPLAY_TEXT();
                                                if (typeof displayText === 'object') {
                                                    var text = displayText.onConversationClose;
                                                }
                                            }
                                            if (!text) {
                                                text = 'Chat disabled with user';
                                            }
                                            $mck_msg_error.html(text);
                                            $mck_msg_error.removeClass('n-vis').addClass('vis').addClass('mck-no-mb');
                                            $mck_msg_form.addClass('n-vis');
                                        }
                                    }
                                } else {
                                    var userIdArray = mckMessageLayout.getUserIdArrayFromMessageList(data.message);
                                    mckContactService.getContactDisplayName(userIdArray);
                                    w.MCK_OL_MAP = [];
                                    if (data.userDetails.length > 0) {
                                        $applozic.each(data.userDetails, function (i, userDetail) {
                                            if (userDetail.connected === true) {
                                                w.MCK_OL_MAP[userDetail.userId] = true;
                                            } else {
                                                w.MCK_OL_MAP[userDetail.userId] = false;
                                                if (typeof userDetail.lastSeenAtTime !== "undefined") {
                                                    MCK_LAST_SEEN_AT_MAP[userDetail.userId] = userDetail.lastSeenAtTime;
                                                }
                                            }
                                            MCK_UNREAD_COUNT_MAP[userDetail.userId] = userDetail.unreadCount;
                                        });
                                    }
                                    if (data.groupFeeds.length > 0) {
                                        $applozic.each(data.groupFeeds, function (i, groupFeed) {
                                            MCK_UNREAD_COUNT_MAP[groupFeed.id] = groupFeed.unreadCount;
                                        });
                                    }
                                    if (data.conversationPxys.length > 0) {
                                        $applozic.each(data.conversationPxys, function (i, conversationPxy) {
                                            MCK_CONVERSATION_MAP[conversationPxy.id] = conversationPxy;
                                            if (conversationPxy.topicDetail) {
                                                MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId] = $applozic.parseJSON(conversationPxy.topicDetail);
                                            }
                                        });
                                    }
                                    if (isMessages) {
                                        mckMessageLayout.addContactsFromMessageList(data, true);
                                        mckStorage.setMckMessageArray(data.message);
                                    }
                                }
                            }
                        }
                        $mck_loading.removeClass('vis').addClass('n-vis');
                        if (!params.startTime) {
                            $mck_msg_inner.animate({
                                scrollTop: $mck_msg_inner.prop("scrollHeight")
                            }, 0);
                            if (typeof callback === 'function') {
                                callback(params);
                            }
                        }
                    },
                    error: function () {
                        $mck_loading.removeClass('vis').addClass('n-vis');
                        w.console.log('Unable to load messages. Please reload page.');
                    }
                });
            };
            _this.loadGroupMessageList = function (groupId) {
                var individual = false;
                var filterParams = {
                    startIndex: 0,
                    pageSize: 100
                };
                if (typeof groupId !== "undefined" && groupId !== "") {
                    individual = true;
                    filterParams.groupId = groupId;
                }
                $mck_msg_inner.html("");
                $mck_loading.removeClass('n-vis').addClass('vis');
                $applozic.ajax({
                    url: MCK_BASE_URL + GROUP_MESSAGE_LIST_URL,
                    type: 'post',
                    data: w.JSON.stringify(filterParams),
                    contentType: 'application/json',
                    global: false,
                    success: function (data) {
                        var currUserId = $mck_msg_inner.data('mck-id');
                        if (groupId === currUserId) {
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
                                if (individual) {
                                    //  w.MCK_OL_MAP[userId] = (data.userDetails.length > 0);
                                    mckMessageLayout.processMessageList(data, true);
                                    $mck_top_btn_panel.removeClass('n-vis').addClass('vis');
                                    $mck_msg_inner.addClass('mck-msg-w-panel');
                                    if (typeof (MCK_CALLBACK) === "function") {
                                        MCK_CALLBACK(groupId);
                                    }
                                } else {
                                    if (data.userDetails.length > 0) {
                                        $applozic.each(data.userDetails, function (i, userDetail) {
                                            MCK_UNREAD_COUNT_MAP[userDetail.userId] = userDetail.unreadCount;
                                        });
                                    }
                                    mckMessageLayout.addGroupFromMessageList(data, true);
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
                        w.console.log('Unable to load messages. Please reload page.');
                    }
                });
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
            _this.sendDeliveryUpdate = function (message) {
                var data = "key=" + message.pairedMessageKey;
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
            _this.sendReadUpdate = function (key) {
                if (typeof key !== "undefined" && key !== "") {
                    var data = "key=" + key;
                    $applozic.ajax({
                        url: MCK_BASE_URL + MESSAGE_READ_UPDATE_URL,
                        data: data,
                        global: false,
                        type: 'get',
                        success: function () {
                        },
                        error: function () {
                        }
                    });
                }
            };
            _this.conversationReadUpdate = function (tabId, isGroup) {
                if (typeof tabId !== "undefined" && tabId !== "" && (mckMessageLayout.getUnreadCount(tabId) > 0)) {
                    var data = (isGroup) ? "groupId=" + tabId : "userId=" + tabId;
                    $applozic.ajax({
                        url: MCK_BASE_URL + CONVERSATION_READ_UPDATE_URL,
                        data: data,
                        global: false,
                        type: 'get',
                        success: function () {
                            MCK_UNREAD_COUNT_MAP[tabId] = 0;
                        },
                        error: function () {
                        }
                    });
                }
            };
            _this.getConversationId = function (params) {
                if (params.topicId) {
                    var conversationPxy = {
                        'topicId': params.topicId,
                        'userId': params.tabId
                    };
                    if (params.isGroup) {
                        conversationPxy.supportIds = [];
                        conversationPxy.supportIds.push(params.supportId);
                    }
                    var topicDetail = MCK_TOPIC_DETAIL_MAP[params.topicId];
                    if (typeof topicDetail === 'object') {
                        conversationPxy.topicDetail = w.JSON.stringify(topicDetail);
                    }
                    $applozic.ajax({
                        url: MCK_BASE_URL + CONVERSATION_ID_URL,
                        global: false,
                        data: w.JSON.stringify(conversationPxy),
                        type: 'post',
                        contentType: 'application/json',
                        success: function (data) {
                            if (typeof data === 'object' && data.status === "success") {
                                var response = data.response;
                                var groupPxy = response;
                                if (typeof groupPxy === 'object' && groupPxy.conversationPxy !== 'undefined') {
                                    var conversationPxy = groupPxy.conversationPxy;
                                    MCK_CONVERSATION_MAP[conversationPxy.id] = conversationPxy;
                                    if (conversationPxy.topicDetail) {
                                        MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId] = $applozic.parseJSON(conversationPxy.topicDetail);
                                    }
                                    $mck_msg_inner.data('mck-conversationid', conversationPxy.id);
                                    params.conversationId = conversationPxy.id;
                                    if (typeof MCK_TAB_CONVERSATION_MAP[params.tabId] !== 'undefined') {
                                        var tabConvArray = MCK_TAB_CONVERSATION_MAP[params.tabId];
                                        tabConvArray.push(conversationPxy);
                                        MCK_TAB_CONVERSATION_MAP[params.tabId] = tabConvArray;
                                    }
                                    if (params.isGroup) {
                                        var group = mckGroupLayout.addGroup(groupPxy);
                                        params.tabId = group.contactId;
                                    }
                                    if (params.isMessage && conversationPxy.created) {
                                        mckMessageLayout.loadTab(params, _this.sendTopicMessage);
                                    } else {
                                        mckMessageLayout.loadTab(params);
                                    }
                                }
                            }
                        },
                        error: function () {
                        }
                    });
                }
            };
            _this.getTopicId = function (params) {
                if (params.conversationId) {
                    var data = "id=" + params.conversationId;
                    $applozic.ajax({
                        url: MCK_BASE_URL + TOPIC_ID_URL,
                        data: data,
                        global: false,
                        type: 'get',
                        success: function (data) {
                            if (typeof data === 'object' && data.status === "success") {
                                var conversationPxy = data.response;
                                if (typeof conversationPxy === 'object') {
                                    MCK_CONVERSATION_MAP[params.conversationId] = conversationPxy;
                                    if (conversationPxy.topicDetail) {
                                        MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId] = $applozic.parseJSON(conversationPxy.topicDetail);
                                    }
                                    if (typeof (MCK_PRICE_DETAIL) === "function" && params.priceText) {
                                        MCK_PRICE_DETAIL({'custId': MCK_USER_ID, 'suppId': params.suppId, 'productId': conversationPxy.topicId, 'price': params.priceText});
                                        _this.sendConversationCloseUpdate(params.conversationId);
                                    }
                                    if (params.messageType && typeof params.message === 'object') {
                                        var tabId = (params.message.groupId) ? params.message.groupId : params.message.to;
                                        if (typeof MCK_TAB_CONVERSATION_MAP[tabId] !== 'undefined') {
                                            var tabConvArray = MCK_TAB_CONVERSATION_MAP[tabId];
                                            tabConvArray.push(conversationPxy);
                                            MCK_TAB_CONVERSATION_MAP[tabId] = tabConvArray;
                                        }
                                        mckMessageLayout.populateMessage(params.messageType, params.message, params.notifyUser);
                                    }
                                }
                            }
                        },
                        error: function () {
                        }
                    });
                }
            };
            _this.sendConversationCloseUpdate = function (conversationId) {
                if (conversationId) {
                    var data = "id=" + conversationId;
                    $applozic.ajax({
                        url: MCK_BASE_URL + CONVERSATION_CLOSE_UPDATE_URL,
                        data: data,
                        global: false,
                        type: 'get',
                        success: function () {
                        },
                        error: function () {
                        }
                    });
                }
            };
            _this.sendPriceMessage = function () {
                var priceText = $mck_price_text_box.val();
                if (priceText === "") {
                    $mck_price_text_box.addClass('mck-text-req');
                    return;
                }
                priceText = $applozic.trim(priceText);
                var tabId = $mck_msg_to.val();
                var conversationId = $mck_msg_inner.data('mck-conversationid', conversationId);
                var messagePxy = {
                    "type": 5,
                    "contentType": 4,
                    "message": priceText
                };
                if ($mck_msg_inner.data("isgroup") === true) {
                    messagePxy.groupId = tabId;
                } else {
                    messagePxy.to = tabId;
                }
                if ($mck_msg_inner.data('mck-conversationid')) {
                    var conversationId = $mck_msg_inner.data('mck-conversationid');
                    messagePxy.conversationId = conversationId;
                    var conversationPxy = MCK_CONVERSATION_MAP[conversationId];
                    if (conversationPxy !== 'object') {
                        _this.getTopicId({'conversationId': conversationId, 'suppId': tabId, 'priceText': priceText});
                    } else if (typeof (MCK_PRICE_DETAIL) === "function") {
                        MCK_PRICE_DETAIL({'custId': MCK_USER_ID, 'suppId': tabId, 'productId': conversationPxy.topicId, 'price': priceText});
                    }
                    $mck_price_text_box.val("");
                }
                _this.sendMessage(messagePxy);
            };
            _this.sendTopicMessage = function (params) {
                if (params.isMessage && params.topicId) {
                    var topicDetail = MCK_TOPIC_DETAIL_MAP[params.topicId];
                    if (typeof topicDetail === 'object' && topicDetail.title !== 'undefined') {
                        var msgText = (params.msgText) ? params.msgText : $applozic.trim(topicDetail.title);
                        var messagePxy = {
                            "type": 5,
                            "contentType": 0,
                            "message": msgText
                        };
                        if (params.isGroup) {
                            messagePxy.groupId = params.tabId;
                        } else {
                            messagePxy.to = params.tabId;
                        }
                        if (params.conversationId) {
                            messagePxy.conversationId = params.conversationId;
                        } else if (params.topicId) {
                            var conversationPxy = {
                                'topicId': params.topicId
                            };
                            if (typeof topicDetail === "object") {
                                conversationPxy.topicDetail = w.JSON.stringify(topicDetail);
                            }
                            messagePxy.conversationPxy = conversationPxy;
                        }
                        if (!(params.msgText) && topicDetail.link) {
                            var fileMeta = {
                                "blobKey": $applozic.trim(topicDetail.link),
                                "contentType": "image/png"
                            };
                            messagePxy.fileMeta = fileMeta;
                            messagePxy.contentType = 5;
                            FILE_META = fileMeta;
                        }
                        _this.sendMessage(messagePxy);
                    }
                }
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
            var $mck_sidebox = $applozic("#mck-sidebox");
            var $mck_file_box = $applozic("#mck-file-box");
            var $mck_msg_sbmt = $applozic("#mck-msg-sbmt");
            var $mck_msg_form = $applozic("#mck-msg-form");
            var $mck_text_box = $applozic("#mck-text-box");
            var $mck_msg_error = $applozic("#mck-msg-error");
            var $mck_show_more = $applozic("#mck-show-more");
            var $mck_tab_title = $applozic("#mck-tab-title");
            var $mck_tab_status = $applozic("#mck-tab-status");
            var $mck_msg_cell = $applozic("#mck-message-cell");
            var $mck_product_box = $applozic("#mck-product-box");
            var $mck_loading = $applozic("#mck-contact-loading");
            var $mck_price_widget = $applozic("#mck-price-widget");
            var $mck_msg_response = $applozic("#mck-msg-response");
            var $mck_product_icon = $applozic(".mck-product-icon");
            var $mck_product_title = $applozic(".mck-product-title");
            var $mck_response_text = $applozic("#mck_response_text");
            var $mck_top_btn_panel = $applozic("#mck-top-btn-panel");
            var $mck_delete_button = $applozic("#mck-delete-button");
            var $mck_tab_individual = $applozic("#mck-tab-individual");
            var $file_progress = $applozic("#mck-file-box .progress");
            var $mck_sidebox_search = $applozic("#mck-sidebox-search");
            var $mck_search_loading = $applozic("#mck-search-loading");
            var $mck_sidebox_content = $applozic("#mck-sidebox-content");
            var $file_remove = $applozic("#mck-file-box .mck-remove-file");
            var $mck_contacts_content = $applozic("#mck-contacts-content");
            var $mck_tab_conversation = $applozic("#mck-tab-conversation");
            var $mck_product_subtitle = $applozic(".mck-product-subtitle");
            var $mck_conversation_list = $applozic("#mck-conversation-list");
            var $modal_footer_content = $applozic(".mck-box-ft .modal-form");
            var $product_box_caret = $applozic("#mck-product-box .mck-caret");
            var $mck_conversation_header = $applozic("#mck-conversation-header");
            var $mck_msg_inner = $applozic("#mck-message-cell .mck-message-inner");
            var $mck_product_up_key = $applozic(".mck-product-rt-up .mck-product-key");
            var $mck_product_up_value = $applozic(".mck-product-rt-up .mck-product-value");
            var $mck_product_down_key = $applozic(".mck-product-rt-down .mck-product-key");
            var $mck_product_down_value = $applozic(".mck-product-rt-down .mck-product-value");
            var FILE_PREVIEW_URL = "/rest/ws/aws/file/";
            var USER_ICON_URL = "/resources/lib/images/ic_action_user.png";
            var markup = '<div name="message" data-msgdelivered="${msgDeliveredExpr}" data-msgsent="${msgSentExpr}" data-msgtype="${msgTypeExpr}" data-msgtime="${msgCreatedAtTime}" data-msgcontent="${replyIdExpr}" data-msgkey="${msgKeyExpr}" data-contact="${toExpr}" class="mck-m-b ${msgKeyExpr} ${msgFloatExpr}"><div class="mck-clear"><div class="blk-lg-12"><div class="mck-msg-box ${msgClassExpr}">' +
                    '<div class="${nameTextExpr} ${showNameExpr}">${msgNameExpr}</div>' +
                    '<div class="mck-file-text mck-msg-text notranslate blk-lg-12 mck-attachment n-vis" data-filemetakey="${fileMetaKeyExpr}" data-filename="${fileNameExpr}" data-filesize="${fileSizeExpr}">{{html fileExpr}}</div>' +
                    '<div class="mck-msg-text mck-msg-content"></div>' +
                    '<div class="n-vis mck-context-menu">' +
                    '<ul><li><a class="mck-message-delete">Delete</a></li></ul></div>' +
                    '</div></div>' +
                    '<div class="${msgFloatExpr}-muted mck-text-light mck-text-muted mck-text-xs mck-t-xs">${createdAtTimeExpr} <i class="${statusIconExpr} mck-message-status"></i></div>' +
                    '</div></div>';
            var contactbox = '<li id="li-${contHtmlExpr}" class="${contIdExpr}" data-msg-time="${msgCreatedAtTimeExpr}">' +
                    '<a class="${mckLauncherExpr}" href="#" data-mck-conversationid="${conversationExpr}" data-mck-id="${contIdExpr}" data-isgroup="${contTabExpr}">' +
                    '<div class="mck-row" title="${contNameExpr}">' +
                    '<div class="mck-conversation-topic mck-truncate ${contHeaderExpr}">${titleExpr}</div>' +
                    '<div class="blk-lg-3">{{html contImgExpr}}</div>' +
                    '<div class="blk-lg-9">' +
                    '<div class="mck-row">' +
                    '<div class="blk-lg-8 mck-cont-name mck-truncate"><div class="mck-ol-status ${contOlExpr}"><span class="mck-ol-icon" title="online"></span>&nbsp;</div><strong>${contNameExpr}</strong></div>' +
                    '<div class="mck-text-muted move-right mck-cont-msg-date mck-truncate blk-lg-4">${msgCreatedDateExpr}</div></div>' +
                    '<div class="mck-row">' +
                    '<div class="mck-cont-msg-wrapper blk-lg-8 mck-truncate">{{html msgTextExpr}}</div>' +
                    '<div class="mck-unread-count-box move-right mck-truncate ${contUnreadExpr}"><span class="mck-unread-count-text">{{html contUnreadCount}}</span></div>' +
                    '</div></div></div></a></li>';
            var convbox = '<li id="li-${convIdExpr}" class="${convIdExpr}">' +
                    '<a class="${mckLauncherExpr}" href="#" data-mck-conversationid="${convIdExpr}" data-mck-id="${tabIdExpr}" data-isgroup="${isGroupExpr}" data-topic-id="${topicIdExpr}" data-isconvtab="true">' +
                    '<div class="mck-row mck-truncate" title="${convTitleExpr}">${convTitleExpr}</div>' +
                    '</a></li>';
            $applozic.template("messageTemplate", markup);
            $applozic.template("contactTemplate", contactbox);
            $applozic.template("convTemplate", convbox);
            _this.openConversation = function () {
                if ($mck_sidebox.css('display') === 'none') {
                    $applozic('.modal').mckModal('hide');
                    $mck_sidebox.mckModal();
                }
                $mck_msg_to.focus();
            };
            _this.loadTab = function (params, callback) {
                var currTabId = $mck_msg_inner.data('mck-id');
                if (currTabId) {
                    if ($mck_text_box.html().length > 1 || $mck_file_box.hasClass('vis')) {
                        var text = $mck_text_box.html();
                        var tab_draft = {
                            'text': text
                        };
                        if ($mck_file_box.hasClass('vis')) {
                            tab_draft.fileMeta = FILE_META;
                            tab_draft.filelb = $file_name.html();
                            tab_draft.filesize = $file_size.html();
                        }
                        TAB_MESSAGE_DRAFT[currTabId] = tab_draft;
                    } else {
                        delete TAB_MESSAGE_DRAFT[currTabId];
                    }
                }
                _this.clearMessageField();
                _this.addDraftMessage(params.tabId);
                $mck_msg_error.html("");
                $mck_msg_error.removeClass('vis').addClass('n-vis');
                $mck_response_text.html("");
                $mck_msg_response.removeClass('vis').addClass('n-vis');
                $mck_msg_form[0].reset();
                $mck_msg_form.removeClass('n-vis');
                $mck_msg_inner.html("");
                $mck_msg_error.removeClass('mck-no-mb');
                $mck_contacts_content.removeClass('n-vis').addClass('vis');
                $modal_footer_content.removeClass('vis').addClass('n-vis');
                $mck_sidebox_search.removeClass('vis').addClass('n-vis');
                $mck_sidebox_content.removeClass('n-vis').addClass('vis');
                $mck_conversation_header.addClass('n-vis');
                $mck_loading.removeClass('vis').addClass('n-vis');
                $mck_msg_inner.removeClass('mck-group-inner');
                $mck_tab_status.removeClass('vis').addClass('n-vis');
                $mck_tab_title.removeClass("mck-tab-title-w-status");
                $mck_msg_inner.data('isgroup', params.isGroup);
                if (typeof params.tabId !== "undefined" && params.tabId !== "") {
                    $mck_msg_to.val(params.tabId);
                    $mck_msg_inner.data('mck-id', params.tabId);
                    $mck_msg_inner.data('mck-conversationid', params.conversationId);
                    $mck_msg_inner.data('mck-topicid', params.topicId);
                    $mck_show_more.data('tabId', params.tabId);
                    $mck_contacts_content.removeClass('vis').addClass('n-vis');
                    $modal_footer_content.removeClass('n-vis').addClass('vis');
                    $mck_delete_button.removeClass('n-vis').addClass('vis');
                    if (params.isGroup) {
                        $mck_msg_inner.addClass('mck-group-inner');
                    }
                    if (!params.topicId && params.conversationId) {
                        var conversationPxy = MCK_CONVERSATION_MAP[params.conversationId];
                        if (typeof conversationPxy === 'object') {
                            params.topicId = conversationPxy.topicId;
                        }
                    }
                    if (params.topicId) {
                        var topicDetail = MCK_TOPIC_DETAIL_MAP[params.topicId];
                        if (typeof topicDetail === "object") {
                            if (IS_MCK_TOPIC_HEADER) {
                                $mck_msg_inner.data('mck-title', topicDetail.title);
                                $mck_conversation_header.html(topicDetail.title);
                                $mck_conversation_header.removeClass('n-vis');
                            } else if (IS_MCK_TOPIC_BOX) {
                                _this.setProductProperties(topicDetail);
                                $mck_product_box.removeClass('n-vis').addClass('vis');
                            }
                        }
                    }
                    $mck_tab_title.html(_this.getTabDisplayName(params.tabId, params.isGroup, params.userName));
                    $mck_tab_conversation.removeClass('vis').addClass('n-vis');
                    $mck_tab_individual.removeClass('n-vis').addClass('vis');
                    if (MCK_MODE === 'support') {
                        $applozic('.mck-tab-link').removeClass('vis').addClass('n-vis');
                    }
                    if (MCK_PRICE_WIDGET_ENABLED) {
                        $mck_price_widget.removeClass('n-vis').addClass('vis');
                        $mck_msg_inner.addClass('mck-msg-w-panel');
                    }
                } else {
                    params.tabId = "";
                    $mck_tab_individual.removeClass('vis').addClass('n-vis');
                    $mck_tab_conversation.removeClass('n-vis').addClass('vis');
                    $mck_product_box.removeClass('vis').addClass('n-vis');
                    $mck_msg_inner.data('mck-id', "");
                    $mck_price_widget.removeClass('vis').addClass('n-vis');
                    $mck_msg_inner.removeClass('mck-msg-w-panel').removeClass('mck-msg-w-widget');
                    $mck_top_btn_panel.removeClass('vis').addClass('n-vis');
                    $mck_delete_button.removeClass('vis').addClass('n-vis');
                    $mck_msg_to.val("");
                    if (!params.isGroup) {
                        var mckMessageArray = mckStorage.getMckMessageArray();
                        if (mckMessageArray !== null && mckMessageArray.length > 0) {
                            mckMessageLayout.addContactsFromMessageList({
                                message: mckMessageArray
                            }, true);
                            $mck_msg_inner.animate({
                                scrollTop: $mck_msg_inner.prop("scrollHeight")
                            }, 0);
                            _this.openConversation();
                            return;
                        }
                    }
                }
                mckMessageService.loadMessageList(params, callback);
                _this.openConversation();
            };
            _this.setProductProperties = function (topicDetail) {
                $mck_product_title.html(topicDetail.title);
                if (topicDetail.link) {
                    $mck_product_icon.html('<img src="' + topicDetail.link + '" />');
                } else {
                    $mck_product_icon.html('<img src="' + MCK_BASE_URL + '/resources/lib/images/no_image.jpg">');
                }
                if (topicDetail.subtitle) {
                    $mck_product_subtitle.html(topicDetail.subtitle);
                }
                if (topicDetail.key1) {
                    $mck_product_up_key.html(topicDetail.key1);
                    $mck_product_up_value.html(topicDetail.value1);
                }
                if (topicDetail.key2) {
                    $mck_product_down_key.html(topicDetail.key2);
                    $mck_product_down_value.html(topicDetail.value2);
                }
            };
            _this.processMessageList = function (data, scroll) {
                var showMoreDateTime;
                if (typeof data.message.length === "undefined") {
                    _this.addMessage(data.message, false, scroll, true);
                    showMoreDateTime = data.createdAtTime;
                } else {
                    $applozic.each(data.message, function (i, message) {
                        if (!(typeof message.to === "undefined")) {
                            _this.addMessage(message, false, scroll, true);
                            showMoreDateTime = message.createdAtTime;
                        }
                    });
                }
                $mck_show_more.data('datetime', showMoreDateTime);
            };
            _this.addTooltip = function (msgKey) {
                $applozic("." + msgKey + " .mck-icon-time").attr('title', 'pending');
                $applozic("." + msgKey + " .mck-btn-trash").attr('title', 'delete');
                $applozic("." + msgKey + " .mck-icon-ok-circle").attr('title', 'sent');
                $applozic("." + msgKey + " .mck-btn-forward").attr('title', 'forward message');
                $applozic("." + msgKey + " .mck-icon-delivered").attr('title', 'delivered');
                $applozic("." + msgKey + " .msgtype-outbox-cr").attr('title', 'sent via Carrier');
                $applozic("." + msgKey + " .msgtype-outbox-mck").attr('title', 'sent');
                $applozic("." + msgKey + " .msgtype-inbox-cr").attr('title', 'received via Carrier');
                $applozic("." + msgKey + " .msgtype-inbox-mck").attr('title', 'recieved');
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
            _this.fetchContact = function (contactId) {
                var contact = _this.getContact(contactId);
                if (typeof contact === 'undefined') {
                    contact = _this.createContact(contactId);
                }
                return contact;
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
            _this.addMessage = function (msg, append, scroll, appendContextMenu) {
                if (msg.type === 6 || msg.type === 7) {
                    return;
                }
                if ($applozic("#mck-message-cell ." + msg.key).length > 0) {
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
                if (msg.contentType === 4) {
                    floatWhere = "mck-msg-price";
                }
                statusIcon = _this.getStatusIconName(msg);
                var replyId = msg.key;
                var replyMessageParameters = "'" + msg.deviceKey + "'," + "'" + msg.to + "'" + ",'" + msg.to + "'" + ",'" + replyId + "'";
                var displayName = "";
                var nameTextExpr = "";
                var showNameExpr = "n-vis";
                if (msg.groupId && msg.contentType !== 4 && (msg.type === 0 || msg.type === 4 || msg.type === 6)) {
                    var displayName = _this.getTabDisplayName(msg.to, false);
                    showNameExpr = "vis";
                    nameTextExpr = _this.getNameTextClassByAlphabet(displayName);
                }
                var msgFeatExpr = "n-vis";
                var fileName = "";
                var fileSize = "";
                var frwdMsgExpr = msg.message;
                if (typeof msg.fileMeta === "object") {
                    fileName = msg.fileMeta.name;
                    fileSize = msg.fileMeta.size;
                }
                var msgList = [
                    {
                        msgKeyExpr: msg.key,
                        msgDeliveredExpr: msg.delivered,
                        msgSentExpr: msg.sent,
                        msgCreatedAtTime: msg.createdAtTime,
                        msgTypeExpr: msg.type,
                        msgSourceExpr: msg.source,
                        statusIconExpr: statusIcon,
                        contactExpr: contactExpr,
                        toExpr: msg.to,
                        showNameExpr: showNameExpr,
                        msgNameExpr: displayName,
                        nameTextExpr: nameTextExpr,
                        msgFloatExpr: floatWhere,
                        replyIdExpr: replyId,
                        createdAtTimeExpr: mckDateUtils.getDate(msg.createdAtTime),
                        msgFeatExpr: msgFeatExpr,
                        replyMessageParametersExpr: replyMessageParameters,
                        msgClassExpr: messageClass,
                        msgExpr: frwdMsgExpr,
                        selfDestructTimeExpr: msg.timeToLive,
                        fileMetaKeyExpr: msg.fileMetaKey,
                        fileExpr: _this.getImagePath(msg),
                        fileNameExpr: fileName,
                        fileSizeExpr: fileSize
                    }
                ];
                append ? $applozic.tmpl("messageTemplate", msgList).appendTo("#mck-message-cell .mck-message-inner") : $applozic.tmpl("messageTemplate", msgList).prependTo("#mck-message-cell .mck-message-inner");
                var emoji_template = "";
                if (typeof msg.message !== 'undefined') {
                    var msg_text = msg.message.replace(/\n/g, '<br/>');
                    emoji_template = w.emoji.replace_unified(msg_text);
                    emoji_template = w.emoji.replace_colons(emoji_template);
                }
                if (msg.conversationId) {
                    var conversationPxy = MCK_CONVERSATION_MAP[msg.conversationId];
                    if (typeof conversationPxy !== 'object') {
                        mckMessageService.getTopicId({'conversationId': msg.conversationId});
                    }
                    if (append) {
                        $mck_msg_inner.data('mck-conversationid', msg.conversationId);
                        if (conversationPxy) {
                            var topicDetail = MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId];
                            if (typeof topicDetail === "object") {
                                if (IS_MCK_TOPIC_BOX) {
                                    $mck_product_title.html(topicDetail.title);
                                    if (topicDetail.link) {
                                        $mck_product_icon.html('<img src="' + topicDetail.link + '" />');
                                    } else {
                                        $mck_product_icon.html('<img src="' + MCK_BASE_URL + '/resources/lib/images/no_image.jpg">');
                                    }
                                    if (topicDetail.subtitle) {
                                        $mck_product_subtitle.html(topicDetail.subtitle);
                                    }
                                    if (topicDetail.key1) {
                                        $mck_product_up_key.html(topicDetail.key1);
                                        $mck_product_up_value.html(topicDetail.value1);
                                    }
                                    if (topicDetail.key2) {
                                        $mck_product_down_key.html(topicDetail.key2);
                                        $mck_product_down_value.html(topicDetail.value2);
                                    }
                                } else if (IS_MCK_TOPIC_HEADER) {
                                    $mck_conversation_header.html(topicDetail.title);
                                }
                            }
                        }
                    }
                }
                if (msg.contentType === 4) {
                    var priceText = emoji_template;
                    emoji_template = "Final agreed price: " + emoji_template;
                    if (!MCK_PRICE_WIDGET_ENABLED)
                        emoji_template += '<br/><button class="mck-accept" data-mck-topic-price="' + priceText + '" data-mck-conversationid="' + msg.conversationId + '">Accept</button>';
                }
                var $textMessage = $applozic("." + replyId + " .mck-msg-content");
                $textMessage.html(emoji_template);
                if (msg.type === 6 || msg.type === 7) {
                    $textMessage.html(_this.getIcon(msg.type) + $textMessage.html());
                    (msg.type === 6) ? $textMessage.addClass("call_incoming") : $textMessage.addClass('call_outgoing');
                }
                $textMessage.linkify({target: '_blank'});
                if (msg.fileMetaKey) {
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
                _this.addTooltip(msg.key);
                if (msg.contentType !== 4 && appendContextMenu) {
                    _this.messageContextMenu(msg.key);
                }
            };
            _this.getImagePath = function (msg) {
                if (msg.fileMetaKey && typeof msg.fileMeta === "object") {
                    if (msg.fileMeta.contentType.indexOf("image") !== -1) {
                        if (msg.fileMeta.contentType.indexOf("svg") !== -1) {
                            return '<a href="#" role="link" class="file-preview-link fancybox-media fancybox"><img src="' + MCK_FILE_URL + FILE_PREVIEW_URL + msg.fileMeta.blobKey + '" area-hidden="true" data-imgurl="' + MCK_FILE_URL + FILE_PREVIEW_URL + msg.fileMeta.blobKey + '"></img></a>';
                        } else if (msg.contentType === 5) {
                            return '<a href="#" role="link" class="file-preview-link fancybox-media fancybox"><img src="' + msg.fileMeta.blobKey + '" area-hidden="true" data-imgurl="' + msg.fileMeta.blobKey + '"></img></a>';
                        } else {
                            return '<a href="#" role="link" class="file-preview-link fancybox-media fancybox"><img src="' + msg.fileMeta.thumbnailUrl + '" area-hidden="true" data-imgurl="' + MCK_FILE_URL + FILE_PREVIEW_URL + msg.fileMeta.blobKey + '"></img></a>';
                        }
                    } else {
                        return '<a href="' + MCK_FILE_URL + FILE_PREVIEW_URL + msg.fileMeta.blobKey + '" role="link" class="file-preview-link" target="_blank"><span class="file-detail"><span class="mck-file-name"><img src="' + MCK_BASE_URL + '/resources/lib/images/ic_action_attachment.png" alt="File">&nbsp;' + msg.fileMeta.name + '</span>&nbsp;<span class="file-size">' + mckFileService.getFilePreviewSize(msg.fileMeta.size) + '</span></span></a>';
                    }
                }
                return "";
            };
            _this.getFileIcon = function (msg) {
                if (msg.fileMetaKey && typeof msg.fileMeta === "object") {
                    return (msg.fileMeta.contentType.indexOf("image") !== -1) ? '<img class="mck-icon-camera" src="' + MCK_BASE_URL + '/resources/lib/images/icon-camera.png" alt="Image"> image' : '<img src="' + MCK_BASE_URL + '/resources/lib/images/ic_action_attachment.png" alt="Image"> file';
                } else {
                    return "";
                }
            };
            _this.getContactImageLink = function (contact, displayName) {
                var imgsrctag = "";
                if (!displayName) {
                    displayName = mckGroupLayout.getGroupDisplayName(contact.contactId);
                }
                if (contact.isGroup) {
                    imgsrctag = _this.getContactImageByAlphabet(displayName);
                } else {
                    if (typeof (MCK_GETUSERIMAGE) === "function") {
                        var imgsrc = MCK_GETUSERIMAGE(contact.contactId);
                        if (imgsrc && typeof imgsrc !== 'undefined') {
                            imgsrctag = '<img src="' + imgsrc + '"/>';
                        }
                    }
                    if (!imgsrctag) {
                        if (contact.photoSrc !== "") {
                            imgsrctag = '<img src="' + contact.photoSrc + '"/>';
                        } else if (contact.photoLink === "") {
                            if (!displayName) {
                                displayName = contact.displayName;
                            }
                            imgsrctag = _this.getContactImageByAlphabet(displayName);
                        } else {
                            imgsrctag = '<img src="' + MCK_BASE_URL + '/contact.image?photoLink=' + contact.photoLink + '"/>';
                        }
                    }
                }
                return imgsrctag;
            };
            _this.getContactImageByAlphabet = function (name) {
                if (typeof name === 'undefined' || name === "") {
                    return '<div class="mck-alpha-contact-image mck-alpha-user"><img src="' + MCK_BASE_URL + USER_ICON_URL + '" alt=""></div>';
                }
                var first_alpha = name.charAt(0);
                var letters = /^[a-zA-Z]+$/;
                if (first_alpha.match(letters)) {
                    first_alpha = first_alpha.toUpperCase();
                    return '<div class="mck-alpha-contact-image alpha_' + first_alpha + '"><span class="mck-contact-icon">' + first_alpha + '</span></div>';
                } else {
                    return '<div class="mck-alpha-contact-image alpha_user"><img src="' + MCK_BASE_URL + USER_ICON_URL + '" alt=""></div>';
                }
            };
            _this.getNameTextClassByAlphabet = function (name) {
                if (typeof name === 'undefined' || name === "") {
                    return 'mck-text-user';
                }
                var first_alpha = name.charAt(0);
                var letters = /^[a-zA-Z]+$/;
                if (first_alpha.match(letters)) {
                    first_alpha = first_alpha.toLowerCase();
                    return 'mck-text-' + first_alpha;
                } else {
                    return 'mck-text-user';
                }
            };
            _this.addContactsFromMessageList = function (data, isReloaded) {
                if (data + '' === "null") {
                    return;
                } else {
                    if (isReloaded) {
                        $mck_msg_inner.html('<ul id="mck-contact-list" class="mck-contact-list mck-nav mck-nav-tabs mck-nav-stacked"></ul>');
                    }
                    if (typeof data.message.length === "undefined") {
                        if (data.message.groupId) {
                            _this.addGroupFromMessage(data.message);
                        } else {
                            _this.addContactsFromMessage(data.message);
                        }
                    } else {
                        $applozic.each(data.message, function (i, message) {
                            if (!(typeof message.to === "undefined")) {
                                if (message.groupId) {
                                    _this.addGroupFromMessage(message, true);
                                } else {
                                    _this.addContactsFromMessage(message, true);
                                }
                            }
                        });
                    }
                }
            };
            _this.addGroupFromMessageList = function (data, isReloaded) {
                if (data + '' === "null") {
                    return;
                } else {
                    if (isReloaded) {
                        $mck_msg_inner.html('<ul id="mck-group-list" class="mck-contact-list mck-nav mck-nav-tabs mck-nav-stacked"></ul>');
                    }
                    if (typeof data.message.length === "undefined") {
                        _this.addGroupFromMessage(data.message);
                    } else {
                        $applozic.each(data.message, function (i, message) {
                            if (!(typeof message.to === "undefined")) {
                                _this.addGroupFromMessage(message, true);
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
                    'appVersion': null,
                    'isGroup': false
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
                    'appVersion': null,
                    'isGroup': false
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
                var contactIdsArray = _this.getUserIdFromMessage(message);
                if (contactIdsArray.length > 0 && contactIdsArray[0]) {
                    for (var i = 0; i < contactIdsArray.length; i++) {
                        var contact = _this.fetchContact('' + contactIdsArray[i]);
                        _this.updateRecentConversationList(contact, message, update);
                    }
                }
            };
            _this.addGroupFromMessage = function (message, update) {
                var groupId = message.groupId;
                var group = mckGroupLayout.getGroup('' + groupId);
                if (typeof group === 'undefined') {
                    group = mckGroupLayout.createGroup(groupId);
                    mckGroupService.loadGroups();
                }
                _this.updateRecentConversationList(group, message, update);
            };
            _this.updateRecentConversationList = function (contact, message, update) {
                var $listId = "mck-contact-list";
                if ($applozic("#" + $listId + " #li-" + contact.htmlId).length > 0) {
                    var $mck_msg_part = $applozic("#" + $listId + " #li-" + contact.htmlId + " .mck-cont-msg-wrapper");
                    if (($mck_msg_part.is(":empty") || update) && message !== undefined) {
                        _this.updateContact(contact, message, $listId);
                    }
                } else {
                    _this.addContact(contact, $listId, message);
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
                        var contact = _this.fetchContact('' + userId);
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
            _this.updateContact = function (contact, message, $listId) {
                var $contactElem = $applozic("#li-" + contact.htmlId);
                var currentMessageTime = $contactElem.data('msg-time');
                if (message && message.createdAtTime > currentMessageTime) {
                    var unreadCount = _this.getUnreadCount(contact.contactId);
                    var emoji_template = _this.getMessageTextForContactPreview(message, contact, 15);
                    $applozic("#li-" + contact.htmlId + " .mck-cont-msg-date").html(typeof message.createdAtTime === 'undefined' ? "" : mckDateUtils.getTimeOrDate(message ? message.createdAtTime : "", true));
                    $applozic("#li-" + contact.htmlId + " .mck-cont-msg-wrapper").html(message ? emoji_template : "");
                    if (message.conversationId) {
                        var conversationId = message.conversationId;
                        var conversationPxy = MCK_CONVERSATION_MAP[conversationId];
                        if (typeof conversationPxy === 'object') {
                            var topicId = conversationPxy.topicId;
                            if (topicId && IS_MCK_TOPIC_HEADER) {
                                var topicDetail = MCK_TOPIC_DETAIL_MAP[topicId];
                                if (typeof topicDetail === "object") {
                                    $applozic("#li-" + contact.htmlId + " .mck-conversation-topic").html(topicDetail.title);
                                }
                            }
                        }
                        $applozic("#li-" + contact.htmlId + " a").data('mck-conversationid', conversationId);
                    }
                    if (unreadCount > 0) {
                        $applozic("#li-" + contact.htmlId + " .mck-unread-count-text").html(unreadCount);
                        $applozic("#li-" + contact.htmlId + " .mck-unread-count-box").removeClass('n-vis').addClass('vis');
                    }
                    var latestCreatedAtTime = $applozic('#' + $listId + ' li:nth-child(1)').data('msg-time');
                    $contactElem.data('msg-time', message.createdAtTime);
                    if ((typeof latestCreatedAtTime === "undefined" || (message ? message.createdAtTime : "") >= latestCreatedAtTime) && $applozic("#mck-contact-list li").index($contactElem) !== 0) {
                        $applozic('#' + $listId + ' li:nth-child(1)').before($contactElem);
                    }
                }
            };
            _this.clearContactMessageData = function (userId) {
                var htmlId = mckContactUtils.formatContactId(userId);
                $applozic("#li-" + htmlId + " .mck-cont-msg-date").html("");
                $applozic("#li-" + htmlId + " .mck-cont-msg-wrapper").html("");
            };
            _this.addContact = function (contact, $listId, message) {
                var emoji_template = _this.getMessageTextForContactPreview(message, contact, 15);
                var conversationId = "";
                var isGroupTab = false;
                if (typeof message !== "undefined") {
                    if (message.conversationId) {
                        conversationId = message.conversationId;
                        var conversationPxy = MCK_CONVERSATION_MAP[conversationId];
                    }
                    if (message.groupId) {
                        isGroupTab = true;
                    }
                }
                var displayName = _this.getTabDisplayName(contact.contactId, isGroupTab);
                var imgsrctag = _this.getContactImageLink(contact, displayName);
                var prepend = false;
                var unreadCount = _this.getUnreadCount(contact.contactId);
                var unreadCountStatus = (unreadCount > 0 && $listId !== "mck-search-list") ? "vis" : "n-vis";
                var olStatus = "n-vis";
                if (IS_MCK_OL_STATUS && w.MCK_OL_MAP[contact.contactId]) {
                    olStatus = "vis";
                    prepend = true;
                }
                var isContHeader = "n-vis";
                if (typeof conversationPxy === 'object' && IS_MCK_TOPIC_HEADER) {
                    var topicDetail = MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId];
                    if (typeof topicDetail === "object") {
                        isContHeader = "vis";
                        var title = topicDetail.title;
                    }
                }
                var contactList = [
                    {
                        contHtmlExpr: contact.htmlId,
                        contIdExpr: contact.contactId,
                        contTabExpr: isGroupTab,
                        msgCreatedAtTimeExpr: message ? message.createdAtTime : "",
                        mckLauncherExpr: MCK_LAUNCHER,
                        contImgExpr: imgsrctag,
                        contOlExpr: olStatus,
                        contUnreadExpr: unreadCountStatus,
                        contUnreadCount: unreadCount,
                        contNameExpr: displayName,
                        conversationExpr: conversationId,
                        contHeaderExpr: isContHeader,
                        titleExpr: title,
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
            _this.addConversationMenu = function (tabId, isGroup) {
                var currTabId = $mck_msg_inner.data('mck-id');
                $mck_conversation_list.html("");
                if (tabId !== currTabId) {
                    return;
                }
                var tabConvArray = MCK_TAB_CONVERSATION_MAP[tabId];
                if (typeof tabConvArray === 'undefined' || tabConvArray.length === 0 || tabConvArray.length === 1) {
                    $product_box_caret.addClass('n-vis');
                    $mck_product_box.addClass('mck-product-box-wc');
                    $mck_conversation_list.addClass('n-vis');
                    return;
                }
                $mck_conversation_list.removeClass('n-vis');
                $product_box_caret.removeClass('n-vis');
                $mck_product_box.removeClass('mck-product-box-wc');
                $applozic.each(tabConvArray, function (i, convPxy) {
                    if ($applozic("#mck-conversation-list #li-" + convPxy.id).length === 0) {
                        var title = "";
                        if (convPxy.topicDetail) {
                            var topicDetail = $applozic.parseJSON(convPxy.topicDetail);
                            title = (typeof topicDetail === 'object') ? topicDetail.title : convPxy.topicDetail;
                        }
                        if (!title) {
                            title = convPxy.topicId;
                        }
                        var convList = [
                            {
                                convIdExpr: convPxy.id,
                                tabIdExpr: tabId,
                                isGroupExpr: isGroup,
                                topicIdExpr: convPxy.topicId,
                                convTitleExpr: title,
                                mckLauncherExpr: MCK_LAUNCHER
                            }
                        ];
                        $applozic.tmpl("convTemplate", convList).appendTo($mck_conversation_list);
                    }
                });
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
                return '<i class="' + _this.getStatusIconName(msg) + ' move-right ' + msg.key + '_status status-icon"></i>';
            };
            _this.getStatusIconName = function (msg) {
                if (msg.type === 7 || msg.type === 6) {
                    return "";
                }
                if (msg.delivered === "true" || msg.delivered === true || ((msg.read === true || msg.read === "true") && msg.type !== 4)) {
                    return 'mck-icon-delivered';
                }
                if (msg.type === 3 || ((msg.sent === "true" || msg.sent === true) && msg.type !== 0 && msg.type !== 4)) {
                    return 'mck-icon-ok-circle';
                }
                if (msg.type === 5 || (msg.type === 1 && (msg.source === 0 || msg.source === 1))) {
                    return 'mck-icon-ok-circle';
                }
                return "";
            };
            _this.clearMessageField = function () {
                $mck_text_box.html("");
                $mck_msg_sbmt.attr('disabled', false);
                $mck_file_box.removeClass('vis').removeClass('mck-text-req').addClass('n-vis').attr("required", "");
            };
            _this.addDraftMessage = function (userId) {
                if ((typeof userId !== 'undefined') && typeof TAB_MESSAGE_DRAFT[userId] === 'object') {
                    var draftMessage = TAB_MESSAGE_DRAFT[userId];
                    $mck_text_box.html(draftMessage.text);
                    if (draftMessage.fileMeta || draftMessage.filelb) {
                        if (draftMessage.fileMeta) {
                            $file_progress.removeClass('vis').addClass('n-vis');
                            $mck_msg_sbmt.attr('disabled', false);
                            $file_remove.attr("disabled", false);
                        } else {
                            $file_progress.removeClass('n-vis').addClass('vis');
                            $mck_msg_sbmt.attr('disabled', true);
                            $file_remove.attr("disabled", true);
                        }
                        FILE_META = draftMessage.fileMeta;
                        $file_name.html(draftMessage.filelb);
                        $file_size.html(draftMessage.filesize);
                        $mck_file_box.removeClass('n-vis').removeClass('mck-text-req').addClass('vis').removeAttr('required');
                    }
                } else {
                    FILE_META = "";
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
            _this.removedDeletedMessage = function (key, userId) {
                mckStorage.clearMckMessageArray();
                var $divMessage = $applozic("." + key);
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
            _this.getMessageTextForContactPreview = function (message, contact, size) {
                var emoji_template = "";
                if (typeof message !== 'undefined') {
                    if (message.message) {
                        var msg = message.message;
                        if (msg.startsWith("<img")) {
                            return '<img class="mck-icon-camera" src="' + MCK_BASE_URL + '/resources/lib/images/icon-camera.png" alt="Image"> image';
                        } else {
                            var x = d.createElement('div');
                            x.innerHTML = msg;
                            msg = $applozic.trim(mckUtils.textVal(x));
                            emoji_template = w.emoji.replace_unified(msg);
                            emoji_template = w.emoji.replace_colons(emoji_template);
                            emoji_template = (emoji_template.indexOf('</span>') !== -1) ? emoji_template.substring(0, emoji_template.lastIndexOf('</span>')) : emoji_template.substring(0, size);
                        }
                    } else if (message.fileMetaKey && typeof message.fileMeta === "object") {
                        emoji_template = (message.fileMeta.contentType.indexOf("image") !== -1) ? '<img class="mck-icon-camera" src="' + MCK_BASE_URL + '/resources/lib/images/icon-camera.png" alt="Image"> image' : '<img src="' + MCK_BASE_URL + '/resources/lib/images/ic_action_attachment.png" alt="Image"> file';
                    }
                    if (contact.isGroup && contact.type !== 3) {
                        var msgFrom = (message.to.split(",")[0] === MCK_USER_ID) ? "Me" : mckMessageLayout.getTabDisplayName(message.to.split(",")[0], false);
                        emoji_template = msgFrom + ": " + emoji_template;
                    }

                }
                return emoji_template;
            };
            _this.getTextForMessagePreview = function (message, contact) {
                var emoji_template = "";
                if (typeof message !== 'undefined') {
                    if (message.message) {
                        var msg = message.message;
                        if (msg.startsWith("<img")) {
                            emoji_template = 'image attachment';
                        } else {
                            var x = d.createElement('div');
                            x.innerHTML = msg;
                            msg = $applozic.trim(mckUtils.textVal(x));
                            emoji_template = msg.substring(0, 50);
                        }
                    } else if (message.fileMetaKey && typeof message.fileMeta === "object") {
                        emoji_template = (message.fileMeta.contentType.indexOf("image") !== -1) ? 'image attachment' : 'file attachment';
                    }
                    if (contact.isGroup && contact.type !== 3) {
                        var msgFrom = (message.to.split(",")[0] === MCK_USER_ID) ? "Me" : mckMessageLayout.getTabDisplayName(message.to.split(",")[0], false);
                        emoji_template = msgFrom + ": " + emoji_template;
                    }
                }
                return emoji_template;
            };
            _this.getUserIdFromMessage = function (message) {
                var tos = message.to;
                if (tos.lastIndexOf(",") === tos.length - 1) {
                    tos = tos.substring(0, tos.length - 1);
                }
                return tos.split(",");
            };
            _this.getUserIdArrayFromMessageList = function (messages) {
                var userIdArray = new Array();
                if (typeof messages.length === "undefined") {
                    userIdArray.concat(_this.getUserIdFromMessage(messages));
                } else {
                    $applozic.each(messages, function (i, message) {
                        if (!(typeof message.to === "undefined")) {
                            userIdArray = userIdArray.concat(_this.getUserIdFromMessage(message));
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
            _this.updateDraftMessage = function (userId, fileMeta) {
                var tab_draft = {
                    'text': ""
                };
                if ((typeof userId !== 'undefined') && typeof TAB_MESSAGE_DRAFT[userId] === 'object') {
                    tab_draft = TAB_MESSAGE_DRAFT[userId];
                }
                if (typeof fileMeta === 'object') {
                    tab_draft.fileMeta = fileMeta;
                    tab_draft.filelb = mckFileService.getFilePreviewPath(fileMeta);
                    tab_draft.filesize = mckFileService.getFilePreviewSize(fileMeta.size);
                }
                TAB_MESSAGE_DRAFT[userId] = tab_draft;
            };
            _this.updateUnreadCount = function (tabId) {
                MCK_UNREAD_COUNT_MAP[tabId] = (typeof (MCK_UNREAD_COUNT_MAP[tabId]) === 'undefined') ? 1 : MCK_UNREAD_COUNT_MAP[tabId] + 1;
            };
            _this.getUnreadCount = function (userId) {
                if (typeof (MCK_UNREAD_COUNT_MAP[userId]) === 'undefined') {
                    MCK_UNREAD_COUNT_MAP[userId] = 0;
                    return 0;
                } else {
                    return MCK_UNREAD_COUNT_MAP[userId];
                }
            };
            _this.getTabDisplayName = function (tabId, isGroup, userName) {
                var displayName = "";
                if (isGroup) {
                    return mckGroupLayout.getGroupDisplayName(tabId);
                } else {
                    if (typeof (MCK_GETUSERNAME) === "function") {
                        displayName = MCK_GETUSERNAME(tabId);
                    }
                    if (typeof userName !== 'undefined') {
                        displayName = userName;
                        MCK_CONTACT_NAME_MAP[tabId] = userName;
                    }
                    if (!displayName) {
                        displayName = _this.getContactDisplayName(tabId);
                    }
                    if (!displayName) {
                        var contact = _this.fetchContact('' + tabId);
                        if (typeof contact.displayName !== "undefined") {
                            displayName = contact.displayName;
                        }
                    }
                    if (!displayName) {
                        displayName = tabId;
                    }
                    return displayName;
                }
            };
            _this.populateMessage = function (messageType, message, notifyUser) {
                var tabId = $mck_msg_inner.data('mck-id');
                var contact = (message.groupId) ? mckGroupLayout.getGroup(message.groupId) : mckMessageLayout.getContact(message.to);
                if ((typeof tabId === "undefined") || tabId === "") {
                    var mckContactListLength = $applozic("#mck-contact-list").length;
                    if (mckContactListLength > 0) {
                        if (message.groupId) {
                            mckMessageLayout.addGroupFromMessage(message, true);
                        } else {
                            mckMessageLayout.addContactsFromMessage(message, true);
                        }
                    }
                    if (messageType === "APPLOZIC_01" || messageType === "MESSAGE_RECEIVED") {
                        if (typeof contact === 'undefined') {
                            contact = (message.groupId) ? mckGroupLayout.createGroup(message.groupId) : mckMessageLayout.createContact(message.to);
                        }
                        mckMessageLayout.updateUnreadCount(contact.contactId);
                        mckNotificationService.notifyUser(message);
                        $applozic("#li-" + contact.htmlId + " .mck-unread-count-text").html(mckMessageLayout.getUnreadCount(contact.contactId));
                        $applozic("#li-" + contact.htmlId + " .mck-unread-count-box").removeClass("n-vis").addClass("vis");
                        mckMessageService.sendDeliveryUpdate(message);
                    }
                } else {
                    if (typeof contact === 'undefined') {
                        contact = (message.groupId) ? mckGroupLayout.createGroup(message.groupId) : mckMessageLayout.createContact(message.to);
                    }
                    if (messageType === "APPLOZIC_01" || messageType === "MESSAGE_RECEIVED") {
                        if (typeof contact !== 'undefined') {
                            if (typeof tabId !== 'undefined' && tabId === contact.contactId) {
                                if (message.conversationId) {
                                    var currConvId = $mck_msg_inner.data('mck-conversationid');
                                    if (currConvId === message.conversationId) {
                                        mckMessageLayout.addMessage(message, true, true, true);
                                        mckMessageService.sendReadUpdate(message.pairedMessageKey);
                                    }
                                } else {
                                    mckMessageLayout.addMessage(message, true, true, true);
                                    mckMessageService.sendReadUpdate(message.pairedMessageKey);
                                }
                                //Todo: use contactNumber instead of contactId for Google Contacts API.
                            } else {
                                mckMessageLayout.updateUnreadCount(contact.contactId);
                                mckMessageService.sendDeliveryUpdate(message);
                            }
                            if (notifyUser) {
                                mckNotificationService.notifyUser(message);
                            }
                        }
                    } else if (messageType === "APPLOZIC_02") {
                        if ((message.type !== 5 || message.source !== 1 || message.fileMetaKey)) {
                            if (mckContactListLength > 0) {
                                mckMessageLayout.addContactsFromMessage(message, true);
                            } else {
                                if (typeof contact !== 'undefined') {
                                    if (typeof tabId !== 'undefined' && tabId === contact.contactId) {
                                        mckMessageLayout.addMessage(message, true, true, true);
                                        if (message.type === 3 || (message.type === 5 && message.fileMetaKey)) {
                                            $applozic("." + message.key + " .mck-message-status").removeClass('mck-icon-time').addClass('mck-icon-ok-circle');
                                            mckMessageLayout.addTooltip(message.key);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                $mck_loading.removeClass('vis').addClass('n-vis');
            };
        }

        function MckContactService() {
            var _this = this;
            var $mck_sidebox_search = $applozic("#mck-sidebox-search");
            var $mck_search_List = $applozic("#mck-search-list");
            var $mck_search_loading = $applozic("#mck-search-loading");
            var $mck_search_inner = $applozic("#mck-search-cell .mck-message-inner");
            var CONTACT_NAME_URL = "/rest/ws/user/info";
            var CONTACT_LIST_URL = "/rest/ws/user/ol/list";
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
                            success: function (data) {
                                for (var userId in data) {
                                    if (data.hasOwnProperty(userId)) {
                                        mckContactNameArray.push([userId, data[userId]]);
                                        MCK_CONTACT_NAME_MAP[userId] = data[userId];
                                        var contact = mckMessageLayout.fetchContact(userId);
                                        contact.displayName = data[userId];
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
                $mck_search_List.html('');
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
                        w.console.log('Unable to load contacts. Please reload page.');
                    }
                });
            };
        }

        function MckGroupService() {
            var _this = this;
            var $mck_loading = $applozic("#mck-contact-loading");
            var GROUP_LIST_URL = "/rest/ws/group/list";
            var GROUP_FEED_URL = "/rest/ws/group/info";
            _this.loadGroups = function () {
                $applozic.ajax({
                    url: MCK_BASE_URL + GROUP_LIST_URL,
                    type: 'get',
                    global: false,
                    success: function (data) {
                        if (data.status === "success") {
                            var groups = data.response;
                            if (groups + '' === "null" || typeof groups === "undefined" || typeof groups.length === 0) {
                                return;
                            }
                            mckGroupLayout.loadGroups(groups);
                            $mck_loading.removeClass('vis').addClass('n-vis');
                        }
                    },
                    error: function () {
                        $mck_loading.removeClass('vis').addClass('n-vis');
                        w.console.log('Unable to load groups. Please reload page.');
                    }
                });
            };
            _this.getGroupFeedFromMessage = function (message, messageType, notifyUser) {
                var data = "groupId=" + message.groupId;
                if (message.conversationId) {
                    var conversationPxy = MCK_CONVERSATION_MAP[message.conversationId];
                    if ((typeof conversationPxy !== 'object') || (typeof MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId] !== 'object')) {
                        data += "&conversationId=" + message.conversationId;
                    }
                }
                $applozic.ajax({
                    url: MCK_BASE_URL + GROUP_FEED_URL,
                    data: data,
                    type: 'get',
                    global: false,
                    success: function (data) {
                        if (data.status === "success") {
                            var groupFeed = data.response;
                            if (groupFeed + '' === "null" || typeof groupFeed !== "object") {
                                return;
                            }
                            var conversationPxy = groupFeed.conversationPxy;
                            mckGroupLayout.addGroup(groupFeed);
                            if (typeof conversationPxy === "object") {
                                var tabConvArray = new Array();
                                MCK_CONVERSATION_MAP[conversationPxy.id] = conversationPxy;
                                if (conversationPxy.topicDetail) {
                                    MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId] = $applozic.parseJSON(conversationPxy.topicDetail);
                                }
                                tabConvArray.push(conversationPxy);
                            }
                            if (tabConvArray.length > 0) {
                                MCK_TAB_CONVERSATION_MAP[message.groupId] = tabConvArray;
                            }
                            mckMessageLayout.populateMessage(messageType, message, notifyUser);
                        }
                    },
                    error: function () {
                        $mck_loading.removeClass('vis').addClass('n-vis');
                        w.console.log('Unable to load groups. Please reload page.');
                    }
                });
            };
        }

        function MckGroupLayout() {
            var _this = this;
            _this.loadGroups = function (groups) {
                if (typeof groups.length === "undefined") {
                    if ((typeof groups.id !== "undefined")) {
                        mckGroupLayout.addGroup(groups);
                    }
                } else {
                    $applozic.each(groups, function (i, group) {
                        if ((typeof group.id !== "undefined")) {
                            mckGroupLayout.addGroup(group);
                        }
                    });
                }
            };
            _this.getGroup = function (groupId) {
                if (typeof MCK_GROUP_MAP[groupId] === 'object') {
                    return  MCK_GROUP_MAP[groupId];
                } else {
                    return;
                }
            };
            _this.getGroupDisplayName = function (groupId) {
                if (typeof MCK_GROUP_MAP[groupId] === 'object') {
                    var group = MCK_GROUP_MAP[groupId];
                    var displayName = group["displayName"];
                    if (group.type === 3) {
                        if (displayName.indexOf(MCK_USER_ID) !== -1) {
                            displayName = displayName.replace(MCK_USER_ID, "").replace(":", "");
                            if (typeof (MCK_GETUSERNAME) === "function") {
                                var name = (MCK_GETUSERNAME(displayName));
                                displayName = (name) ? name : displayName;
                            }
                        }
                    }
                    if (!displayName) {
                        displayName = group.contactId;
                    }
                    return displayName;
                } else {
                    return groupId;
                }
            };
            _this.addGroup = function (group) {
                var name = (group.name) ? group.name : group.id;
                var groupFeed = {
                    'contactId': group.id.toString(),
                    'htmlId': mckContactUtils.formatContactId('' + group.id),
                    'displayName': name,
                    'name': name + " <" + group.id + ">" + " [" + "Main" + "]",
                    'value': group.id.toString(),
                    'adminName': group.adminName,
                    'type': group.type,
                    'members': group.membersName,
                    'isGroup': true
                };
                MCK_GROUP_MAP[group.id] = groupFeed;
                return groupFeed;
            };
            _this.createGroup = function (groupId) {
                var group = {
                    'contactId': groupId.toString(),
                    'htmlId': mckContactUtils.formatContactId('' + groupId),
                    'name': groupId + " <" + groupId + ">" + " [" + "Main" + "]",
                    'displayName': groupId.toString(),
                    'value': groupId.toString(),
                    'type': 2,
                    'adminName': "",
                    'isGroup': true
                };
                MCK_GROUP_MAP[groupId] = group;
                return group;
            };
        }

        function MckStorage() {
            var _this = this;
            var MCK_MESSAGE_ARRAY = [];
            var MCK_CONTACT_NAME_ARRAY = [];
            _this.getMckMessageArray = function () {
                return (typeof (w.sessionStorage) !== "undefined") ? $applozic.parseJSON(w.sessionStorage.getItem("mckMessageArray")) : MCK_MESSAGE_ARRAY;
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
                        w.sessionStorage.setItem('mckMessageArray', w.JSON.stringify(mckMessageArray));
                    }
                    return  mckMessageArray;
                } else {
                    MCK_MESSAGE_ARRAY = MCK_MESSAGE_ARRAY.concat(mckMessageArray);
                    return MCK_MESSAGE_ARRAY;
                }
            };
            _this.getMckContactNameArray = function () {
                return (typeof (w.localStorage) !== "undefined") ? $applozic.parseJSON(w.localStorage.getItem("mckContactNameArray")) : MCK_CONTACT_NAME_ARRAY;
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
            var FILE_PREVIEW_URL = "/rest/ws/aws/file";
            var FILE_UPLOAD_URL = "/rest/ws/aws/file/url";
            var FILE_DELETE_URL = "/rest/ws/aws/file/delete";
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
                        if (FILE_META === "object") {
                            _this.deleteFileMeta(FILE_META.blobKey);
                            FILE_META = "";
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
                                url: MCK_FILE_URL + FILE_UPLOAD_URL,
                                global: false,
                                data: "data=" + new Date().getTime(),
                                crosDomain: true,
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
                        if (typeof result.fileMeta === "object") {
                            var file_meta = result.fileMeta;
                            var fileExpr = _this.getFilePreviewPath(file_meta);
                            var name = file_meta.name;
                            var size = file_meta.size;
                            var currTabId = $mck_msg_inner.data('mck-id');
                            var uniqueId = name + size;
                            var fileTabId = TAB_FILE_DRAFT[uniqueId];
                            if (fileTabId !== currTabId) {
                                mckMessageLayout.updateDraftMessage(fileTabId, file_meta);
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
                            FILE_META = file_meta;
                            return false;
                        } else {
                            FILE_META = "";
                            $file_remove.trigger('click');
                        }
                    },
                    error: function () {
                        FILE_META = "";
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
                if (typeof FILE_META === "object") {
                    _this.deleteFileMeta(FILE_META.blobKey);
                    FILE_META = "";
                }
            });
            _this.deleteFileMeta = function (blobKey) {
                $applozic.ajax({
                    url: MCK_FILE_URL + FILE_DELETE_URL + '?key=' + blobKey,
                    type: 'post',
                    success: function () {
                    },
                    error: function () {
                    }
                });
            };
            _this.getFilePreviewPath = function (fileMeta) {
                return (typeof fileMeta === "object") ? '<a href="' + MCK_FILE_URL + FILE_PREVIEW_URL + fileMeta.blobKey + '" target="_blank">' + fileMeta.name + '</a>' : "";
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
            var $mck_msg_inner;
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
                $mck_msg_inner = $applozic("#mck-message-cell .mck-message-inner");
                $mck_preview_icon = $applozic("#mck-msg-preview .mck-preview-icon");
                $mck_preview_name = $applozic("#mck-msg-preview .mck-preview-cont-name");
                $mck_preview_msg_content = $applozic("#mck-msg-preview .mck-preview-msg-content");
                $mck_preview_file_content = $applozic("#mck-msg-preview .mck-preview-file-content");
                notificationTimeout = 60;
            };
            _this.isChrome = function () {
                return /chrom(e|ium)/.test(w.navigator.userAgent.toLowerCase());
            };
            _this.notifyUser = function (message) {
                var notificationTimeout = 60;
                if (message.type === 7) {
                    return;
                }
                var contact = (message.groupId) ? mckGroupLayout.getGroup('' + message.groupId) : mckMessageLayout.fetchContact('' + message.to.split(",")[0]);
                var isGroup = false;
                if (message.groupId) {
                    isGroup = true;
                }
                var displayName = mckMessageLayout.getTabDisplayName(contact.contactId, isGroup);
                _this.showNewMessageNotification(message, contact, displayName);
                if (IS_MCK_NOTIFICATION && !IS_MCK_TAB_FOCUSED) {
                    if (_this.isChrome()) {
                        var msg = mckMessageLayout.getTextForMessagePreview(message, contact);
                        var c_version = parseInt(w.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
                        if (c_version >= 35) {
                            if (!w.Notification) {
                                return;
                            }
                            if (w.Notification.permission !== "granted") {
                                w.Notification.requestPermission();
                            }
                            var notification = new w.Notification(displayName, {
                                body: msg
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
                                return;
                            }
                            if (w.webkitNotifications.checkPermission() === 0) {
                                var notification = w.webkitNotifications.createNotification(displayName, msg);
                                _this.showNotification(notification);
                            }
                        }
                    } else {
                        if (typeof w.webkitNotifications === "undefined") {
                            return;
                        }
                        if (w.webkitNotifications.checkPermission() === 0) {
                            var notification = w.webkitNotifications.createNotification("/favicon.ico", displayName, msg);
                            _this.showNotification(notification);
                        }
                    }
                }
            };
            _this.showNewMessageNotification = function (message, contact, displayName) {
                var currTabId = $mck_msg_inner.data('mck-id');
                if (currTabId === contact.contactId) {
                    if (message.conversationId) {
                        var currConvId = $mck_msg_inner.data('mck-conversationid');
                        if (currConvId === message.conversationId.toString()) {
                            return;
                        }
                    } else {
                        return;
                    }
                }
                $mck_msg_preview.data('isgroup', contact.isGroup);
                if (message.conversationId) {
                    $mck_msg_preview.data('mck-conversationid', message.conversationId);
                }
                var imgsrctag = mckMessageLayout.getContactImageLink(contact, displayName);
                if (message.message) {
                    $mck_preview_msg_content.html(mckMessageLayout.getMessageTextForContactPreview(message, contact, 50));
                    $mck_preview_msg_content.removeClass('n-vis').addClass('vis');
                } else {
                    $mck_preview_msg_content.html("");
                }
                if (message.fileMetaKey) {
                    $mck_preview_file_content.html(mckMessageLayout.getFileIcon(message));
                    $mck_preview_file_content.removeClass('n-vis').addClass('vis');
                    if ($mck_preview_msg_content.html() === "") {
                        $mck_preview_msg_content.removeClass('vis').addClass('n-vis');
                    }
                } else {
                    $mck_preview_file_content.html("");
                    $mck_preview_file_content.removeClass('vis').addClass('n-vis');
                }
                $mck_preview_name.html(displayName);
                $mck_preview_icon.html(imgsrctag);
                $mck_msg_preview.data('mck-id', contact.contactId);
                $mck_msg_preview.show();
                setTimeout(function () {
                    $mck_msg_preview.fadeOut(3000);
                }, 10000);
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

        function MckInitializeChannel(socketUrl, token) {
            var stompClient = null;
            var port = (!socketUrl.startsWith("https")) ? "15674" : "15675";
            var socket = new SockJS(socketUrl + ":" + port + "/stomp");
            var $mck_message_inner = $applozic("#mck-message-cell .mck-message-inner");
            stompClient = w.Stomp.over(socket);
            stompClient.heartbeat.outgoing = 0;
            stompClient.heartbeat.incoming = 0;
            stompClient.connect("guest", "guest", on_connect, on_error, '/');
            w.addEventListener("beforeunload", function (e) {
                send_status(0);
            });
            function on_error(err) {
                w.console.log("Error in channel notification. " + err.body);
            }
            function send_status(status) {
                stompClient.send('/topic/status', {"content-type": "text/plain"}, token + "," + status);
            }
            function on_connect() {
                stompClient.subscribe("/topic/" + token, on_message);
                send_status(1);
            }
            function on_message(obj) {
                var resp = $applozic.parseJSON(obj.body);
                var messageType = resp.type;
                if (messageType === "APPLOZIC_04" || messageType === "MESSAGE_DELIVERED" || messageType === "APPLOZIC_08" || messageType === "MT_MESSAGE_DELIVERED_READ") {
                    $applozic("." + resp.message.split(",")[0] + " .mck-message-status").removeClass('mck-icon-time').removeClass('mck-icon-ok-circle').addClass('mck-icon-delivered');
                    mckMessageLayout.addTooltip(resp.message.split(",")[0]);
                } else if (messageType === "APPLOZIC_05") {
                    var key = resp.message.split(",")[0];
                    var userId = resp.message.split(",")[1];
                    mckMessageLayout.removedDeletedMessage(key, userId);
                } else if (messageType === "APPLOZIC_06") {
                    var userId = resp.message;
                    if (typeof userId !== 'undefined') {
                        mckMessageLayout.removeConversationThread(userId);
                    }
                } else if (messageType === "APPLOZIC_11") {
                    var userId = resp.message;
                    var contact = mckMessageLayout.fetchContact(userId);
                    var tabId = $mck_message_inner.data('mck-id');
                    if (tabId === contact.contactId) {
                        $applozic("#mck-tab-status").html("Online");
                    } else {
                        var htmlId = mckContactUtils.formatContactId(userId);
                        $applozic("#li-" + htmlId + " .mck-ol-status").removeClass('n-vis').addClass('vis');
                    }
                    w.MCK_OL_MAP[userId] = true;
                } else if (messageType === "APPLOZIC_12") {
                    var userId = resp.message.split(",")[0];
                    var lastSeenAtTime = resp.message.split(",")[1];
                    w.MCK_OL_MAP[userId] = false;
                    if (lastSeenAtTime) {
                        MCK_LAST_SEEN_AT_MAP[userId] = lastSeenAtTime;
                    }
                    var htmlId = mckContactUtils.formatContactId(userId);
                    $applozic("#li-" + htmlId + " .mck-ol-status").removeClass('vis').addClass('n-vis');
                } else if (messageType === "APPLOZIC_09)") {
                    var userId = resp.message;
                    var contact = mckMessageLayout.fetchContact(userId);
                    MCK_UNREAD_COUNT_MAP[contact.contactId] = 0;
                    var tabId = $mck_message_inner.data('mck-id');
                    if ((typeof tabId === "undefined") || tabId === "") {
                        $applozic("#li-" + contact.htmlId + " .mck-unread-count-text").html(mckMessageLayout.getUnreadCount(contact.contactId));
                        $applozic("#li-" + contact.htmlId + " .mck-unread-count-box").removeClass("vis").addClass("n-vis");
                    }
                } else if (messageType === "APPLOZIC_10") {
                    var userId = resp.message;
                    var contact = mckMessageLayout.fetchContact(userId);
                    var tabId = $mck_message_inner.data('mck-id');
                    if (tabId === contact.contactId) {
                        $applozic(".mck-msg-right .mck-message-status").removeClass('mck-icon-time').removeClass('mck-icon-ok-circle').addClass('mck-icon-delivered');
                        $applozic(".mck-msg-right .mck-icon-delivered").attr('title', 'delivered');
                    }
                } else {
                    var message = resp.message;
                    //  var userIdArray = mckMessageLayout.getUserIdFromMessage(message);
                    // mckContactService.getContactDisplayName(userIdArray);
                    //  mckMessageLayout.openConversation();
                    if (messageType === "APPLOZIC_03" && message.type !== 0 && message.type !== 4) {
                        $applozic("." + message.key + " .mck-message-status").removeClass('mck-icon-time').addClass('mck-icon-ok-circle');
                        mckMessageLayout.addTooltip(message.key);
                        return;
                    } else if (messageType === "APPLOZIC_01" || messageType === "APPLOZIC_02" || messageType === "MESSAGE_RECEIVED") {
                        var messageArray = [];
                        messageArray.push(message);
                        mckStorage.updateMckMessageArray(messageArray);
                        var contact = (message.groupId) ? mckGroupLayout.getGroup(message.groupId) : mckMessageLayout.getContact(message.to);
                        var $mck_sidebox_content = $applozic("#mck-sidebox-content");
                        var tabId = $mck_message_inner.data('mck-id');
                        if (!$mck_sidebox_content.hasClass('n-vis')) {
                            if (typeof contact === 'undefined' && message.groupId) {
                                mckGroupService.getGroupFeedFromMessage(message, messageType, resp.notifyUser);
                                return;
                            } else {
                                if (message.conversationId) {
                                    var conversationPxy = MCK_CONVERSATION_MAP[message.conversationId];
                                    if ((IS_MCK_TOPIC_HEADER || IS_MCK_TOPIC_BOX) && ((typeof conversationPxy !== 'object') || (typeof (MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId]) !== 'object'))) {
                                        mckMessageService.getTopicId({'conversationId': message.conversationId, 'messageType': messageType, 'message': message, 'notifyUser': resp.notifyUser});
                                        return;
                                    }
                                }
                                mckMessageLayout.populateMessage(messageType, message, resp.notifyUser);
                            }
                        }
                    }
                }
            }
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
                return ((currentDate.getDate() === date.getDate()) && (currentDate.getMonth() === date.getMonth()) && (currentDate.getYear() === date.getYear())) ? dateFormat(date, onlyTimeFormat, false) : dateFormat(date, fullDateFormat, false);
            };
            _this.getLastSeenAtStatus = function (lastSeenAtTime) {
                var date = new Date(parseInt(lastSeenAtTime, 10));
                var localDate = new Date();
                var utcTime = parseInt(date.getTime() + (localDate.getTimezoneOffset() * 60000));
                date = new Date(parseInt(utcTime + parseInt(MCK_USER_TIMEZONEOFFSET, 10)));
                var currentDate = new Date();
                var utcCurrentTime = parseInt(currentDate.getTime() + (localDate.getTimezoneOffset() * 60000));
                currentDate = new Date(parseInt(utcCurrentTime + parseInt(MCK_USER_TIMEZONEOFFSET, 10)));
                if ((currentDate.getDate() === date.getDate()) && (currentDate.getMonth() === date.getMonth()) && (currentDate.getYear() === date.getYear())) {
                    var hoursDiff = currentDate.getHours() - date.getHours();
                    if (hoursDiff < 1) {
                        var minDiff = currentDate.getMinutes() - date.getMinutes();
                        return  (minDiff <= 1) ? "Last seen 1 min ago" : "Last seen " + minDiff + " mins ago";
                    }
                    return (hoursDiff === 1) ? "Last seen 1 hour ago" : "Last seen " + hoursDiff + " hours ago";
                } else if (((currentDate.getDate() - date.getDate() === 1) && (currentDate.getMonth() === date.getMonth()) && (currentDate.getYear() === date.getYear()))) {
                    return "Last seen on yesterday";
                } else {
                    return "Last seen on " + dateFormat(date, onlyDateFormat, false);
                }
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
                    return ((currentDate.getDate() === date.getDate()) && (currentDate.getMonth() === date.getMonth()) && (currentDate.getYear() === date.getYear())) ? dateFormat(date, onlyTimeFormat, false) : dateFormat(date, onlyDateFormat, false);
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
                                L: pad(L > 99 ? w.Math.round(L / 10) : L),
                                t: H < 12 ? "a" : "p",
                                tt: H < 12 ? "am" : "pm",
                                T: H < 12 ? "A" : "P",
                                TT: H < 12 ? "AM" : "PM",
                                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                                o: (o > 0 ? "-" : "+") + pad(w.Math.floor(w.Math.abs(o) / 60) * 100 + w.Math.abs(o) % 60, 4),
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
