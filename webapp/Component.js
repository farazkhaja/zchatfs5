sap.ui.define([
    "sap/ui/core/UIComponent",
    "au/com/wow/zchatfs5/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("au.com.wow.zchatfs5.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            this._fnHashChange = this._handleNavigation.bind(this);
            window.addEventListener("hashchange", this._fnHashChange);
            // Check the current tile immediately
            this._handleNavigation();
        },

        _handleNavigation: function () {
            // if (!this._bChatbotUserAllowed) {
            //     return;
            // }

            var sHash = window.location.hash || "";

            // Extract the Launchpad intent, excluding parameters and app routes
            var sIntent = sHash
                .replace(/^#/, "")
                .split("?")[0]
                .split("&/")[0];

            if (sIntent.includes("Launchpad") || sIntent.includes("Shell")) {
                var oButton = document.getElementById("woolworths-chatbot-button");
                var oWindow = document.getElementById("woolworths-chatbot-window");
                if (oButton) {
                    oButton.style.display = "none";
                }
                if (oWindow) {
                    oWindow.classList.remove("open");
                }
                return;
            }

            let sAppInTable = "";
            if (sIntent === "LoyaltyPlanning-manage") {
                sAppInTable = "LYLTYPLN";
            }
            else if (sIntent === "LoyaltyCampMgm-manage") {
                sAppInTable = "LYLTYCMP";
            }
            else if (sIntent === "calendar01-list") {
                sAppInTable = "CALENDAR";
            }
            else {
                sAppInTable = sIntent;
            }
            
            // const oModel = this.getModel();
            // const oListBinding = oModel.bindList("/outagedowntime", null, null, [
            //     new sap.ui.model.Filter("application", "EQ", sAppInTable)
            // ]);
            let bShowChatbot = false;
            // oListBinding.requestContexts()
            //     .then(aContexts => {
            //         const aData = aContexts.map(c => c.getObject());
            //         console.log("Outage result:", aData);
            //         if (aData[0].application !== "" && (aData[0].message === undefined || aData[0].message === null || aData[0].message === "") && aData[0].show_chat !== false) {
            //             //No downtime. Show the icon
            //             bShowChatbot = true;
            //         }
            //         else {
            //             //Downtime in progress. Do not show icon
            //             bShowChatbot = false;
            //         }

                    var oButton = document.getElementById(
                        "woolworths-chatbot-button"
                    );

                    var oWindow = document.getElementById(
                        "woolworths-chatbot-window"
                    );

                    // if (bShowChatbot) {
                        this._createChatbot();

                        oButton = document.getElementById(
                            "woolworths-chatbot-button"
                        );

                        if (oButton && !(oWindow && oWindow.classList.contains("open"))) {
                            oButton.style.display = "flex";
                        }
                    // }
                    // else {
                    //     if (oButton) {
                    //         oButton.style.display = "none";
                    //     }

                    //     if (oWindow) {
                    //         oWindow.classList.remove("open");
                    //     }
                    // }
            // });

            // Applications (Tile intents) for which chatbot is required
            // var aAllowedIntents = [
            //     "calendar01-list",
            //     "LoyaltyPlanning-manage",
            //     "LoyaltyCampMgm-manage"
            // ];

            // // var bShowChatbot = aAllowedIntents.includes(sIntent);

            // var oButton = document.getElementById(
            //     "woolworths-chatbot-button"
            // );

            // var oWindow = document.getElementById(
            //     "woolworths-chatbot-window"
            // );

            // if (bShowChatbot) {
            //     this._createChatbot();

            //     oButton = document.getElementById(
            //         "woolworths-chatbot-button"
            //     );

            //     if (oButton && !(oWindow && oWindow.classList.contains("open"))) {
            //         oButton.style.display = "flex";
            //     }
            // } else {
            //     if (oButton) {
            //         oButton.style.display = "none";
            //     }

            //     if (oWindow) {
            //         oWindow.classList.remove("open");
            //     }
            // }
        },


            _createChatbot: function () {
                // if (sap.ushell.Container.getUser().getFullName() !== 'Faraz Khaja') {
                //     return;
                // }

                if (document.getElementById(
                    "woolworths-chatbot-button"
                )) {
                    return;
                }

                this._loadCSS();

                this._createFloatingButton();

                // if (sap.ushell.Container.getUser().getFullName() !== 'Faraz Khaja') {
                //     return;
                // }

                const sFirstName = sap.ushell.Container.getUser().getFirstName() || "";
                const sLastName = sap.ushell.Container.getUser().getLastName() || "";

                const sInitials = (sFirstName.charAt(0) + sLastName.charAt(0)).toUpperCase();
                this._createChatbotWindow(sInitials);
            },

            _loadCSS: function () {

                var oLink =
                    document.createElement("link");

                oLink.rel = "stylesheet";

                oLink.href =
                    sap.ui.require.toUrl(
                        "au/com/wow/zchatfs5"
                    ) +
                    "/css/style.css";

                document.head.appendChild(oLink);
            },

            _createFloatingButton: function () {
                var that = this;
                var oButton = document.createElement("div");

                oButton.id = "woolworths-chatbot-button";

                oButton.innerHTML = `
                    <img
                        src="${sap.ui.require.toUrl(
                            "au/com/wow/zchatfs5/icons/Lime_Profile.png"
                        )}"
                        alt="Open Lime5"
                        class="woolworths-chatbot-button-icon"
                        draggable="false"
                    />
                `;

                oButton.title = "Open Lime5";

                oButton.addEventListener("click", function () {
                    if (oButton.dataset.dragged === "true") {
                        return;
                    }

                    that._toggleChatbot();
                });

                document.body.appendChild(oButton);
                
                var bDragging = false;
                var bMoved = false;
                var iStartX = 0;
                var iStartY = 0;
                var iStartLeft = 0;
                var iStartTop = 0;

                oButton.addEventListener("pointerdown", function (oEvent) {
                    bDragging = true;
                    bMoved = false;

                    iStartX = oEvent.clientX;
                    iStartY = oEvent.clientY;

                    var oRect = oButton.getBoundingClientRect();

                    iStartLeft = oRect.left;
                    iStartTop = oRect.top;

                    // Switch from right/bottom positioning to left/top
                    oButton.style.left = iStartLeft + "px";
                    oButton.style.top = iStartTop + "px";
                    oButton.style.right = "auto";
                    oButton.style.bottom = "auto";

                    oButton.setPointerCapture(oEvent.pointerId);
                });

                oButton.addEventListener("pointermove", function (oEvent) {
                    if (!bDragging) {
                        return;
                    }

                    var iDeltaX = oEvent.clientX - iStartX;
                    var iDeltaY = oEvent.clientY - iStartY;

                    if (Math.abs(iDeltaX) > 5 || Math.abs(iDeltaY) > 5) {
                        bMoved = true;
                    }

                    if (!bMoved) {
                        return;
                    }

                    var iMaxLeft = window.innerWidth - oButton.offsetWidth;
                    var iMaxTop = window.innerHeight - oButton.offsetHeight;

                    var iNewLeft = Math.max(
                        0,
                        Math.min(iMaxLeft, iStartLeft + iDeltaX)
                    );

                    var iNewTop = Math.max(
                        0,
                        Math.min(iMaxTop, iStartTop + iDeltaY)
                    );

                    oButton.style.left = iNewLeft + "px";
                    oButton.style.top = iNewTop + "px";
                });

                oButton.addEventListener("pointerup", function (oEvent) {
                    bDragging = false;

                    // Prevent opening the chatbot after dragging
                    if (bMoved) {
                        oButton.dataset.dragged = "true";
                        setTimeout(function () {
                            delete oButton.dataset.dragged;
                        }, 100);
                    }
                });

                oButton.addEventListener("pointercancel", function () {
                    bDragging = false;
                });

            },

            _createChatbotWindow: function (sInitials) {

                this._sUserInitials = sInitials || "You";

                var oWindow =
                    document.createElement("div");

                oWindow.id =
                    "woolworths-chatbot-window";

                oWindow.innerHTML = `
                    <div class="woolworths-chatbot-header">

                        <img
                            class="woolworths-chatbot-avatar"
                            src="${sap.ui.require.toUrl(
                                "au/com/wow/zchatfs5/icons/Lime_Profile.png"
                            )}"
                            alt="Assistant profile"
                        />

                        <span class="woolworths-chatbot-title">
                            Lime
                        </span>

                        <button
                            id="woolworths-chatbot-minimize"
                            class="woolworths-chatbot-minimize"
                            title="Minimize"
                            aria-label="Minimize chatbot">
                            −
                        </button>

                        <button
                            id="woolworths-chatbot-close"
                            class="woolworths-chatbot-close"
                            title="Close"
                            aria-label="Close chatbot">
                            ×
                        </button>

                    </div>

                    <div
                        id="woolworths-chatbot-messages"
                        class="woolworths-chatbot-messages">

                        <div class="woolworths-chatbot-assistant-row">
                            <img
                                class="woolworths-chatbot-message-avatar"
                                src="${sap.ui.require.toUrl(
                                    "au/com/wow/zchatfs5/icons/Lime_Bubble.png"
                                )}"
                                alt="Lime"
                            />

                            <div class="woolworths-chatbot-message-assistant">
                                Hi, I am Lime5.<br><br>
                                I am your training chatbot and will assist you with training material loaded in SAP Central.<br><br>
                                Please ask me anything related to Promotions Portal; I will answer it.
                            </div>
                        </div>

                    </div>

                    <div class="woolworths-chatbot-input">

                        <input
                            id="woolworths-chatbot-input"
                            type="text"
                            placeholder="Ask Lime"
                        />

                        <button
                            id="woolworths-chatbot-send"
                            title="Send message"
                            aria-label="Send message">
                            ↑
                        </button>

                    </div>
                `;

                document.body.appendChild(
                    oWindow
                );

                document
                .getElementById("woolworths-chatbot-minimize")
                .addEventListener(
                    "click",
                    this._minimizeChatbot.bind(this)
                );

                document
                    .getElementById(
                        "woolworths-chatbot-close"
                    )
                    .addEventListener(
                        "click",
                        this._closeChatbot.bind(this)
                    );

                document
                    .getElementById(
                        "woolworths-chatbot-send"
                    )
                    .addEventListener(
                        "click",
                        this._sendMessage.bind(this)
                    );

                document
                    .getElementById(
                        "woolworths-chatbot-input"
                    )
                    .addEventListener(
                        "keydown",
                        function (oEvent) {

                            if (
                                oEvent.key === "Enter"
                            ) {
                                this._sendMessage();
                            }

                        }.bind(this)
                    );
            },

            _toggleChatbot: function () {
                var oWindow = document.getElementById(
                    "woolworths-chatbot-window"
                );

                var oButton = document.getElementById(
                    "woolworths-chatbot-button"
                );

                if (!oWindow || !oButton) {
                    return;
                }

                oWindow.classList.add("open");
                oButton.style.display = "none";
            },

            _minimizeChatbot: function () {
                var oWindow = document.getElementById(
                    "woolworths-chatbot-window"
                );

                var oButton = document.getElementById(
                    "woolworths-chatbot-button"
                );

                if (oWindow) {
                    oWindow.classList.remove("open");
                }

                if (oButton) {
                    oButton.style.display = "flex";
                }
            },

            _closeChatbot: function () {
                this._minimizeChatbot();
            },

            _sendMessage: async function () {
                var oInput = document.getElementById(
                    "woolworths-chatbot-input"
                );

                var sQuestion = oInput.value.trim();

                if (!sQuestion) {
                    return;
                }

                oInput.value = "";

                // User message on the right
                this._addMessage(sQuestion, "user");

                try {
                    // await this.onTestDirectChatbotCall();
                    var oResponse = await this._askChatbot(sQuestion);

                    // Assistant response on the left
                    this._addMessage(
                        oResponse.answer || "I couldn't generate a response.",
                        "Lime"
                    );
                } catch (oError) {
                    console.error("Chatbot error", oError);

                    this._addMessage(
                        "Sorry, something went wrong.",
                        "Lime"
                    );
                }
            },

            
            
            _addMessage: function (sText, sSender) {
                var oMessages = document.getElementById(
                    "woolworths-chatbot-messages"
                );

                var oMessageRow = document.createElement("div");

                var bIsUser = sSender === "user";

                oMessageRow.className =
                    "woolworths-chatbot-message-row " +
                    (bIsUser ? "user-row" : "assistant-row");

                // User initials avatar on the right
                if (bIsUser) {
                    var oAvatar = document.createElement("div");

                    oAvatar.className =
                        "woolworths-chatbot-user-avatar";

                    oAvatar.textContent =
                        this._sUserInitials || "U";

                    oMessageRow.appendChild(oAvatar);
                } else {
                    // Lime icon on the left
                    var oAvatar = document.createElement("img");

                    oAvatar.className =
                        "woolworths-chatbot-message-avatar";

                    oAvatar.src = sap.ui.require.toUrl(
                        "au/com/wow/zchatfs5/icons/Lime_Bubble.png"
                    );

                    oAvatar.alt = "Lime";

                    oMessageRow.appendChild(oAvatar);
                }

                // Message bubble
                var oMessage = document.createElement("div");

                oMessage.className =
                    "woolworths-chatbot-message " +
                    (bIsUser ? "user" : "assistant");

                // Safely display message text
                oMessage.textContent = sText;

                oMessageRow.appendChild(oMessage);
                oMessages.appendChild(oMessageRow);

                // Scroll to the latest message
                oMessages.scrollTop = oMessages.scrollHeight;
            },

            _askChatbot: async function (
                sQuestion
            ) {

                var oPayload = {
                    userId: "1390664", //sUserId,
                    sessionId: "101", //sSessionId,
                    salesOrg: "1005", //sSalesOrg,
                    currentScreen: "ViewPlan", //sCurrentScreen,
                    message: sQuestion,
                    clear: false
                };
            
                const oResponse = await fetch("/chatbot-api/api/v1/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    // credentials: "same-origin",
                    body: JSON.stringify(oPayload)
                });

                const sResponseBody = await oResponse.text();

                console.log("Chatbot API status:", oResponse.status);
                console.log("Chatbot API response:", sResponseBody);
                
                if (!oResponse.ok) {
                    throw new Error(
                        "Chatbot API failed: HTTP " + oResponse.status +
                        " - " + sResponseBody
                    );
                }
                debugger;
            },

            exit: function () {

                if (this._fnHashChange) {
                    window.removeEventListener(
                        "hashchange",
                        this._fnHashChange
                    );
                }

                var oButton =
                    document.getElementById(
                        "woolworths-chatbot-button"
                    );

                var oWindow =
                    document.getElementById(
                        "woolworths-chatbot-window"
                    );

                if (oButton) {
                    oButton.remove();
                }

                if (oWindow) {
                    oWindow.remove();
                }
            }
    });
});