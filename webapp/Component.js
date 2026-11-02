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

            // Load local marked.js library globally on startup
            jQuery.sap.includeScript(
                sap.ui.require.toUrl("au/com/wow/zchatfs5/libs/marked.min.js"),
                "markedLib",
                function () {
                    console.log("marked.js loaded successfully.");
                },
                function (oError) {
                    console.error("Failed to load marked.js:", oError);
                }
            );

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
            const INTENT_MAP = {
                "LoyaltyPlanning-manage": "LYLTYPLN",
                "LoyaltyCampMgm-manage": "LYLTYCMP",
                "calendar01-list": "CALENDAR",
                "promotion_report-report": "CMPROMOREP",
                "cm_smry_rpt-list": "CMSUM-REP",
                "dealsoffersreview-list": "DEALOFRREV",
                "dealsearch-list": "DEALREPORT",
                "LoyaltyPlanningSupp-supp": "LYLTYPLNVN",
                "massupldofrdl01-list": "MASDEALOFR",
                "massuploadtactics01-list": "MASTACTICS",
                "offerconstructreport-list": "OFRCONSREP",
                "offersearchreport-list": "OFRSRRPT",
                "productcustomgroup-list": "PORTFOL-CG",
                "productreport-list": "PORTFOLIO",
                "unactionedDealsReport-list": "UNACTDLREP",
                "report-list": "VENDORREPO"
            };
            let sAppInTable = "";
            sAppInTable = INTENT_MAP[sIntent] || sIntent;

            const oModel = this.getModel();
            const oListBinding = oModel.bindList("/outagedowntime", null, null, [
                new sap.ui.model.Filter("application", "EQ", sAppInTable)
            ]);
            let bShowChatbot = false;
            oListBinding.requestContexts()
                .then(aContexts => {
                    const aZpmrData = aContexts.map(c => c.getObject());
                    console.log("Outage result:", aZpmrData);
                    if (aZpmrData[0].application !== "" && (aZpmrData[0].message === undefined || aZpmrData[0].message === null || aZpmrData[0].message === "") && aZpmrData[0].show_chat !== false) {
                        //No downtime. Show the icon
                        bShowChatbot = true;
                    }
                    else {
                        //Downtime in progress. Do not show icon
                        bShowChatbot = false;
                    }

                    var oButton = document.getElementById(
                        "woolworths-chatbot-button"
                    );

                    var oWindow = document.getElementById(
                        "woolworths-chatbot-window"
                    );

                    if (bShowChatbot) {
                        this._createChatbot(aZpmrData);

                        oButton = document.getElementById(
                            "woolworths-chatbot-button"
                        );

                        if (oButton && !(oWindow && oWindow.classList.contains("open"))) {
                            oButton.style.display = "flex";
                        }
                    }
                    else {
                        if (oButton) {
                            oButton.style.display = "none";
                        }

                        if (oWindow) {
                            oWindow.classList.remove("open");
                        }
                    }
            });
        },


            _createChatbot: function (aZpmrData) {
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
                this._createChatbotWindow(sInitials, aZpmrData);
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
                        alt="Open Lime."
                        class="woolworths-chatbot-button-icon"
                        draggable="false"
                    />
                `;

                oButton.title = "Open Lime";

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

            _createChatbotWindow: function (sInitials, aZpmrData) {

                this._sUserInitials = sInitials || "You";
                this._aZpmrData = aZpmrData || [];

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
                            id="woolworths-chatbot-maximize"
                            class="woolworths-chatbot-maximize"
                            title="Maximise"
                            aria-label="Maximise chatbot">
                            ⛶
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
                                Hi, I am Lime.<br><br>
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
                .getElementById("woolworths-chatbot-maximize")
                .addEventListener(
                    "click",
                    this._toggleMaximizeChatbot.bind(this)
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

            _toggleMaximizeChatbot: function () {

                var oWindow = document.getElementById(
                    "woolworths-chatbot-window"
                );

                var oButton = document.getElementById(
                    "woolworths-chatbot-maximize"
                );

                if (!oWindow || !oButton) {
                    return;
                }

                var bIsMaximized = oWindow.classList.toggle("maximized");

                if (bIsMaximized) {

                    oButton.innerHTML = "❐";
                    oButton.title = "Restore";
                    oButton.setAttribute("aria-label", "Restore chatbot");

                } else {

                    oButton.innerHTML = "⛶";
                    oButton.title = "Maximise";
                    oButton.setAttribute("aria-label", "Maximise chatbot");

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

                var aZpmrData = this._aZpmrData || [];
                // Display the user's question
                this._addMessage(sQuestion, "user", "", "");

                // Show the thinking indicator below the question
                var sThinkingId = this._showThinkingIndicator();

                try {
                    var oResponse = await this._askChatbot(sQuestion, aZpmrData);

                    // Remove the thinking indicator
                    this._removeThinkingIndicator(sThinkingId);

                    // Display Lime's response
                    this._addMessage(
                        oResponse.answer || "I couldn't generate a response.",
                        "Lime",
                        oResponse.sources || [],
                        oResponse.interactionId
                    );
                } catch (oError) {
                    console.error("Chatbot error", oError);

                    // Remove the thinking indicator
                    this._removeThinkingIndicator(sThinkingId);

                    // Extract the actual error message
                    var sErrorMessage = oError.message || "Sorry, something went wrong.";

                    // Extract JSON detail if the error contains an HTTP response body
                    var oMatch = sErrorMessage.match(/HTTP \d+ - (\{.*\})/);

                    if (oMatch) {
                        try {
                            var oErrorResponse = JSON.parse(oMatch[1]);
                            sErrorMessage = oErrorResponse.detail || sErrorMessage;
                        } catch (e) {
                            // Keep the original error message if parsing fails
                        }
                    }

                    // Display the actual error message
                    this._addMessage(
                        sErrorMessage,
                        "Lime",
                        []
                    );

                    }
            },
            
            _addMessage: function (sText, sSender, aSources, sInteractionId) {
                var oMessages = document.getElementById(
                    "woolworths-chatbot-messages"
                );

                var oMessageRow = document.createElement("div");
                var bIsUser = sSender === "user";

                oMessageRow.className =
                    "woolworths-chatbot-message-row " +
                    (bIsUser ? "user-row" : "assistant-row");

                // Avatar
                if (bIsUser) {
                    var oAvatar = document.createElement("div");

                    oAvatar.className = "woolworths-chatbot-user-avatar";
                    oAvatar.textContent = this._sUserInitials || "U";

                    oMessageRow.appendChild(oAvatar);
                } else {
                    var oAvatar = document.createElement("img");

                    oAvatar.className = "woolworths-chatbot-message-avatar";
                    oAvatar.src = sap.ui.require.toUrl(
                        "au/com/wow/zchatfs5/icons/Lime_Bubble.png"
                    );
                    oAvatar.alt = "Lime";

                    oMessageRow.appendChild(oAvatar);
                }

                // Message content wrapper
                var oContent = document.createElement("div");

                oContent.className = bIsUser
                    ? "woolworths-chatbot-user-content"
                    : "woolworths-chatbot-assistant-content";

                // Message bubble
                var oMessage = document.createElement("div");

                oMessage.className =
                    "woolworths-chatbot-message " +
                    (bIsUser ? "user" : "assistant");

                // oMessage.textContent = sText;
                if (bIsUser) {
                    oMessage.textContent = sText;
                } else {
                    // Check if marked is available, otherwise fall back to text
                    if (window.marked && typeof window.marked.parse === "function") {
                        oMessage.innerHTML = window.marked.parse(sText);
                    } else {
                        oMessage.textContent = sText; // Fallback if script is still loading
                    }
                }
                oContent.appendChild(oMessage);

                // Add collapsible sources
                if (!bIsUser && Array.isArray(aSources) && aSources.length > 0) {

                    // Sources container
                    var oSources = document.createElement("div");
                    oSources.className = "woolworths-chatbot-sources";

                    // Collapsible heading
                    var oSourcesButton = document.createElement("button");
                    oSourcesButton.className = "woolworths-chatbot-sources-toggle";
                    oSourcesButton.type = "button";
                    oSourcesButton.textContent = "Sources";

                    // Arrow
                    var oArrow = document.createElement("span");
                    oArrow.className = "woolworths-chatbot-sources-arrow";
                    oArrow.textContent = "\u25BC";

                    oSourcesButton.appendChild(oArrow);

                    // Collapsible content
                    var oSourcesContent = document.createElement("div");
                    oSourcesContent.className = "woolworths-chatbot-sources-content";

                    var oSourceList = document.createElement("ul");

                    aSources.forEach(function (oSource) {

                        if (!oSource.filename || !oSource.url) {
                            return;
                        }

                        var oListItem = document.createElement("li");
                        var oLink = document.createElement("a");

                        oLink.textContent = oSource.filename;
                        oLink.href = oSource.url;
                        oLink.target = "_blank";
                        oLink.rel = "noopener noreferrer";

                        oListItem.appendChild(oLink);
                        oSourceList.appendChild(oListItem);
                    });

                    oSourcesContent.appendChild(oSourceList);

                    // Toggle expand/collapse
                    oSourcesButton.addEventListener("click", function () {

                        var bExpanded = oSourcesButton.classList.toggle("active");

                        oSourcesContent.style.maxHeight = bExpanded
                            ? oSourcesContent.scrollHeight + "px"
                            : "0px";

                        oArrow.textContent = bExpanded
                            ? "\u25B2"
                            : "\u25BC";
                    });

                    oSources.appendChild(oSourcesButton);
                    oSources.appendChild(oSourcesContent);

                    oContent.appendChild(oSources);
                }


                // Add feedback only to Lime's responses
                if (!bIsUser) {
                    var oFeedback = document.createElement("div");

                    oFeedback.className = "woolworths-chatbot-feedback";
                    oFeedback.setAttribute("role", "group");
                    oFeedback.setAttribute(
                        "aria-label",
                        "Rate Lime's response"
                    );

                    oContent.appendChild(oFeedback);

                    var oThumbUp = new sap.ui.core.Icon({
                        src: "sap-icon://thumb-up",
                        size: "1rem",
                        decorative: false,
                        tooltip: "Helpful",
                        useIconTooltip: true,
                        press: function () {
                            selectFeedback(oThumbUp, oThumbDown, "UP", sInteractionId);
                        }
                    });

                    var oThumbDown = new sap.ui.core.Icon({
                        src: "sap-icon://thumb-down",
                        size: "1rem",
                        decorative: false,
                        tooltip: "Not helpful",
                        useIconTooltip: true,
                        press: function () {
                            selectFeedback(oThumbDown, oThumbUp, "DOWN", sInteractionId);
                        }
                    });

                    oThumbUp.addStyleClass(
                        "woolworths-chatbot-feedback-icon"
                    );

                    oThumbDown.addStyleClass(
                        "woolworths-chatbot-feedback-icon"
                    );

                    var that = this;
                    // Track the selected rating for this response
                    function selectFeedback(oSelected, oOther, sRating, sInteractionId) {
                        oSelected.addStyleClass("feedback-selected");
                        oOther.removeStyleClass("feedback-selected");

                        // Store the selection on this response's feedback area
                        oFeedback.dataset.rating = sRating;

                        console.log("Lime feedback:", sRating);

                        // Submit feedback to the backend
                        that._submitFeedback(sInteractionId, sRating, "", "");
                        that._submitFeedbackFetch(sInteractionId, sRating, "", "");
                    }

                    // Render SAPUI5 Icon controls into the feedback container
                    oThumbUp.placeAt(oFeedback);
                    oThumbDown.placeAt(oFeedback);
                }

                oMessageRow.appendChild(oContent);
                oMessages.appendChild(oMessageRow);

                // Scroll to the latest message
                oMessages.scrollTop = oMessages.scrollHeight;
            },

            _submitFeedback: async function (
                sInteractionId,
                sRating,
                sReasonCode,
                sComment
            ) {
                try {
                    var oModel = this.getModel("feedbackModel");

                    if (!oModel) {
                        throw new Error("Feedback OData model is not configured.");
                    }

                    var oAction = oModel.bindContext("/submitFeedback(...)");

                    oAction.setParameter("interactionId", sInteractionId);
                    oAction.setParameter("rating", sRating);
                    oAction.setParameter("reasonCode", sReasonCode || "");
                    oAction.setParameter("comment", sComment || "");

                    await oAction.execute();
                    sap.m.MessageToast.show("Feedback submitted successfully.");

                } catch (oError) {
                    console.error("Failed to submit feedback:", oError);
                    sap.m.MessageToast.show("Failed to submit feedback.");
                }
            },
            _submitFeedbackFetch: async function (
                sInteractionId,
                sRating,
                sReasonCode,
                sComment
            ) {
                try {
                    if (!sInteractionId) {
                        throw new Error("Missing interaction ID.");
                    }

                    var sFeedbackUrl =
                        sap.ui.require.toUrl("au/com/wow/zchatfs5") +
                        "/feedback-api/submitFeedback";

                    var oResponse = await fetch(sFeedbackUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        credentials: "same-origin",
                        body: JSON.stringify({
                            interactionId: sInteractionId,
                            rating: sRating,
                            reasonCode: sReasonCode || "",
                            comment: sComment || ""
                        })
                    });

                    if (!oResponse.ok) {
                        var sError = await oResponse.text();

                        throw new Error(
                            "Feedback API failed: HTTP " +
                            oResponse.status +
                            " - " +
                            sError
                        );
                    }

                    var oResult = await oResponse.json();

                    console.log("Feedback submitted:", oResult);

                    this._showChatToast(
                        "Feedback submitted successfully.",
                        true
                    );

                } catch (oError) {
                    console.error("Failed to submit feedback:", oError);

                    this._showChatToast(
                        "Failed to submit feedback.",
                        false
                    );
                }
            },

            _showThinkingIndicator: function () {
                var oMessages = document.getElementById(
                    "woolworths-chatbot-messages"
                );

                var sThinkingId = "woolworths-chatbot-thinking-" +
                    Date.now() + "-" + Math.random().toString(36).slice(2, 8);

                // Create the message row
                var oRow = document.createElement("div");

                oRow.id = sThinkingId;

                oRow.className =
                    "woolworths-chatbot-message-row assistant-row";

                // Add Lime's avatar
                var oAvatar = document.createElement("img");

                oAvatar.className =
                    "woolworths-chatbot-message-avatar";

                oAvatar.src = sap.ui.require.toUrl(
                    "au/com/wow/zchatfs5/icons/Lime_Bubble.png"
                );

                oAvatar.alt = "Lime";

                oRow.appendChild(oAvatar);

                // Create the animated thinking bubble
                var oThinking = document.createElement("div");

                oThinking.className = "woolworths-chatbot-thinking";

                oThinking.setAttribute("role", "status");
                oThinking.setAttribute("aria-label", "Lime is thinking");

                oThinking.innerHTML =
                    '<span></span><span></span><span></span>';

                oRow.appendChild(oThinking);

                // Insert below the user's question
                oMessages.appendChild(oRow);

                // Scroll to the latest message
                oMessages.scrollTop = oMessages.scrollHeight;

                return sThinkingId;
            },

            _removeThinkingIndicator: function (sThinkingId) {
                var oThinking = document.getElementById(sThinkingId);

                if (oThinking) {
                    oThinking.remove();
                }
            },
            _askChatbot: async function (
                sQuestion, aZpmrData
            ) {

                var oPayload = {
                    userId: aZpmrData[0].user_id, //sUserId,
                    sessionId: "101", //sSessionId,
                    salesOrg: "", // aZpmrData has no sales org
                    currentScreen: "", // determine application and screen?,
                    message: sQuestion,
                    clear: false
                };
            
                const sAppPath = sap.ui.require.toUrl("au/com/wow/zchatfs5");
                const sUrl = sAppPath + "/chatbot-api/api/v1/chat";
                const oResponse = await fetch(sUrl, {
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

                // Parse the JSON returned by the API
                const oResult = JSON.parse(sResponseBody);
                // Return the API response in a consistent format
                return {
                    answer: oResult.response,
                    sources: oResult.sources || [],
                    interactionId: oResult.interactionId || "0000000000"
                };
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