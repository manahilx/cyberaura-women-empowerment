"""Static product content: incident taxonomy, response playbooks, assessment model,
verified Pakistan support directory and the digital-safety learning module.

Contact details in RESOURCES were checked against the organisations' own published
pages. Nothing here is invented; where a detail could not be verified it is omitted.
"""

CATEGORIES = [
    {
        "key": "cyberstalking",
        "label": "Cyberstalking",
        "short": "Repeated tracking, monitoring or unwanted contact",
        "icon": "eye",
        "accent": "violet",
    },
    {
        "key": "impersonation",
        "label": "Fake account / Impersonation",
        "short": "Someone is using your name or photographs",
        "icon": "masks",
        "accent": "purple",
    },
    {
        "key": "harassment",
        "label": "Online harassment",
        "short": "Abuse, insults, pile-ons or hateful comments",
        "icon": "message",
        "accent": "violet",
    },
    {
        "key": "blackmail",
        "label": "Blackmail / Threats",
        "short": "Coercion, extortion or image-based abuse",
        "icon": "alert",
        "accent": "danger",
    },
    {
        "key": "compromise",
        "label": "Suspicious login / Account compromise",
        "short": "Access you did not authorise",
        "icon": "key",
        "accent": "purple",
    },
    {
        "key": "exposure",
        "label": "Privacy exposure",
        "short": "Personal details visible to strangers",
        "icon": "globe",
        "accent": "violet",
    },
    {
        "key": "phishing",
        "label": "Suspicious messages or phishing",
        "short": "Links, logins or requests designed to deceive",
        "icon": "hook",
        "accent": "warning",
    },
    {
        "key": "other",
        "label": "Other",
        "short": "Something else that feels unsafe",
        "icon": "compass",
        "accent": "violet",
    },
]

CATEGORY_LABELS = {c["key"]: c["label"] for c in CATEGORIES}

PLATFORMS = [
    "Instagram", "Facebook", "WhatsApp", "TikTok", "X (Twitter)", "Snapchat",
    "YouTube", "LinkedIn", "Telegram", "Email", "Gaming platform", "Website / forum",
    "SMS / phone call", "Other",
]

# Detection patterns used by the transparent rule-based interpreter.
CATEGORY_SIGNALS = {
    "impersonation": [
        (r"fake (account|profile|page|id)", "Duplicate identity", "A profile is presenting itself as you or as someone else."),
        (r"impersonat|pretend(ing)? to be|posing as", "Impersonation language", "The account claims an identity that does not belong to it."),
        (r"my (pictures|photos|images|photo)|using my (pics|photographs)", "Photographs reused without consent", "Your images are being used to make the profile look genuine."),
        (r"messaging my (friends|contacts|family)|contacting my (friends|family)", "Contact-graph abuse", "The account is reaching people who trust you, which raises the chance of fraud or reputational harm."),
        (r"clone|duplicat|same name|stole(n)? my identity", "Identity cloning", "Cloned profiles are commonly used to borrow trust from your real network."),
    ],
    "cyberstalking": [
        (r"stalk|follow(ing)? me|track(ing)? me|watch(ing)? me", "Persistent monitoring", "Repeated tracking behaviour can escalate from online to physical space."),
        (r"knows where i (live|work|study)|my address|my location|found my (house|home)", "Location knowledge", "The person appears to know real-world locations, which increases physical safety risk."),
        (r"every day|constantly|again and again|repeat(ed|edly)|won'?t stop|keeps? (messaging|calling)", "Persistent contact", "Frequency and persistence are recognised escalation indicators."),
        (r"new accounts?|different numbers?|after i block", "Block evasion", "Creating new accounts or numbers after being blocked shows deliberate intent."),
        (r"airtag|spyware|location shar|tracking app|gps", "Possible device or location tracking", "Location may be leaking through a device, app or shared account."),
    ],
    "harassment": [
        (r"harass|abus(e|ive)|insult|humiliat|bully|troll", "Abusive conduct", "Targeted abuse can cause sustained psychological and reputational harm."),
        (r"hate|threatening comments|nasty (comments|messages)|slurs", "Hostile content", "Hostile content directed at you may breach platform rules and local law."),
        (r"pile.?on|many (people|accounts)|group (is|are) (posting|targeting)", "Coordinated targeting", "Coordinated campaigns amplify reach and are harder to contain manually."),
        (r"comments? (section|on my posts)|under my (photos|posts)", "Public visibility of abuse", "Public abuse remains discoverable and can affect study or work."),
    ],
    "blackmail": [
        (r"blackmail|extort|coerc|demand(ing)? (money|payment|cash)", "Extortion demand", "A demand attached to a threat is a coercive crime pattern, not a negotiation."),
        (r"pay (them|him|her|me)|send money|ransom|jazzcash|easypaisa|bank transfer", "Financial coercion", "Payment rarely ends extortion and usually triggers further demands."),
        (r"private (photos|pictures|images|video)|intimate|nude|naked|morphed|deepfake|edited (photo|picture)", "Image-based abuse risk", "Threatened distribution of intimate or manipulated imagery is a serious offence."),
        (r"leak|post (it|them) (online|everywhere)|send (it|them) to my (family|friends)|viral", "Threatened distribution", "Threats to distribute material are used to create urgency and silence."),
        (r"threat(en|ening|s)?|will (hurt|kill|ruin|expose)|hurt my family", "Explicit threat", "Explicit threats to safety or reputation require urgent official support."),
    ],
    "compromise": [
        (r"login (alert|notification|attempt)|sign.?in (alert|from)|new device", "Unrecognised access event", "Access from an unknown device or place suggests credential misuse."),
        (r"can'?t (log|sign) in|locked out|password (changed|reset) (without|by)|account (hacked|taken over)", "Loss of account control", "Losing control of an account lets an attacker reach your contacts and data."),
        (r"otp|verification code|one.?time (code|password)|shared (the )?code", "One-time code exposure", "Sharing a one-time code is the most common route to account takeover."),
        (r"messages? i (didn'?t|did not) send|posts? i didn'?t (make|write)", "Actions you did not perform", "Activity you did not authorise indicates an active session held by someone else."),
        (r"recovery (email|phone) (changed|isn'?t mine)", "Recovery channel tampering", "Changed recovery details let an attacker keep control after a password reset."),
    ],
    "exposure": [
        (r"phone number (is )?(public|visible|online)|number (leaked|posted)", "Contact details exposed", "A visible phone number enables direct harassment, fraud and SIM-targeted attacks."),
        (r"address (online|public|posted)|home address|dox(x)?(ed|ing)?", "Doxxing", "Published home or work details convert online conflict into physical risk."),
        (r"personal (information|data|details) (online|leaked|visible)|cnic|id card", "Identity data exposure", "Identity documents can be reused for fraud or further impersonation."),
        (r"everyone can see|public profile|searchable|found my profile", "Over-broad visibility", "Public visibility widens the audience that can collect and reuse your information."),
        (r"daily routine|schedule|where i (study|work)|check.?in", "Routine disclosure", "Routine posts let someone predict where you will be."),
    ],
    "phishing": [
        (r"link|url|http|click(ed)? (on|a)", "Link-based lure", "Links are the primary delivery method for credential theft and malware."),
        (r"verify your account|confirm (your )?(identity|password)|account will be (closed|suspended|deleted)", "Urgency pretext", "Artificial urgency is designed to stop you from checking the sender."),
        (r"prize|lottery|won|free (gift|money)|investment|double your", "Reward bait", "Unexpected rewards are a standard social-engineering hook."),
        (r"bank|otp|card number|cvv|password (request|needed)", "Credential or financial request", "Legitimate services do not ask for passwords or one-time codes by message."),
        (r"unknown (number|sender)|strange (message|email)|suspicious (email|message)", "Untrusted sender", "An unverified sender combined with a request is a high-risk combination."),
    ],
    "other": [
        (r".{20,}", "Narrative received", "Your description was reviewed against general digital-safety risk patterns."),
    ],
}

# Cross-category escalation patterns. Each adds weight to the risk score.
ESCALATIONS = [
    (r"kill|hurt me|physically|weapon|gun|acid|attack me", 4, "Threat to physical safety", "Language indicating physical danger. Treat personal safety as the first priority."),
    (r"intimate|nude|naked|private (photos|pictures|video)|morphed|deepfake", 3, "Intimate or manipulated imagery", "Image-based abuse carries severe reputational and legal consequences and specific reporting routes."),
    (r"my address|where i live|home address|my location|found my (house|home)", 3, "Real-world location known", "Online activity may translate into physical approach or surveillance."),
    (r"money|payment|ransom|pay (them|him|her)|jazzcash|easypaisa", 2, "Financial coercion", "A monetary demand usually escalates rather than resolves after payment."),
    (r"leak|viral|post (it|them) (online|everywhere)|send (it|them) to my (family|friends)", 2, "Threat of publication", "Publication threats are used to pressure you into silence and quick decisions."),
    (r"every day|constantly|repeat(ed|edly)|won'?t stop|keeps? (messaging|calling)|again and again", 1, "Persistence", "Repeated behaviour over time is a recognised escalation indicator."),
    (r"new accounts?|different numbers?|after i block", 2, "Evasion of blocks", "Working around blocks shows planning and intent."),
    (r"minor|school|college|underage|1[0-7] (years|year)", 2, "Possible involvement of a minor", "Cases involving minors receive priority handling by official agencies."),
    (r"ex[- ]?(partner|boyfriend|husband)|colleague|classmate|relative|someone i know", 1, "Known person", "A known person may already hold personal details and physical access."),
    (r"cnic|id card|passport|bank (details|account)", 2, "Identity or financial documents", "Document exposure enables fraud beyond the original incident."),
]

CATEGORY_BASE_RISK = {
    "blackmail": 3, "cyberstalking": 2, "compromise": 2, "impersonation": 1,
    "harassment": 1, "exposure": 1, "phishing": 1, "other": 0,
}

WHY_RISKY = {
    "impersonation": "A profile that borrows your name and photographs inherits the trust your friends and family already have in you. That trust can be used to request money, collect private information or publish content in your name. Because the account looks familiar, people often respond before they verify, so harm can spread through your own contact list quickly.",
    "cyberstalking": "Persistent monitoring reduces your ability to move through digital and physical space without being observed. When the person also knows your location or routine, online behaviour can become physical approach. Block evasion and repeated new accounts indicate planning rather than a single impulsive act.",
    "harassment": "Targeted abuse is rarely a one-off. Public comments stay discoverable, can be screenshotted and re-shared, and may reach employers or institutions. Coordinated campaigns increase volume faster than manual blocking can contain, which is why platform-level reporting and evidence capture matter early.",
    "blackmail": "Extortion depends on urgency and fear. Paying or continuing to negotiate usually confirms that the pressure works and leads to further demands. Where intimate or manipulated imagery is involved, the material itself must not be redistributed, and specialised official reporting routes exist precisely for this pattern.",
    "compromise": "An attacker with an active session can read private conversations, message your contacts as you, and change recovery details so that a password reset alone does not remove them. Recovery therefore has to cover sessions and recovery channels, not just the password.",
    "exposure": "Information that is publicly visible can be collected, combined and reused indefinitely. A phone number enables direct contact and SIM-targeted fraud; an address or routine enables physical approach; identity documents enable impersonation. Reducing visibility now limits what can be collected later.",
    "phishing": "Deceptive messages are engineered to make you act before you verify. A single credential entry on a look-alike page can hand over an entire account, and a one-time code shared by message can bypass two-factor protection. The link, the sender and the request should each be checked independently.",
    "other": "The description does not match a single dominant pattern, so this result is deliberately conservative. Unclear situations still deserve evidence capture and a review of account visibility, because early documentation preserves options if the behaviour continues or escalates.",
}

IMMEDIATE_ACTIONS = {
    "impersonation": [
        "Capture the fake profile URL, display name, handle and profile photograph before reporting it.",
        "Report the account through the platform's official impersonation form, not only the in-app block button.",
        "Post a short notice on your genuine account so contacts know which profile is real.",
        "Ask friends who received messages to keep them rather than delete them.",
    ],
    "cyberstalking": [
        "Do not confront or negotiate with the person; engagement often increases contact.",
        "Turn off location sharing and review who can see your posts, stories and friend list.",
        "Check connected apps and active sessions on every account you use.",
        "Tell one trusted person what is happening so you are not managing it alone.",
    ],
    "harassment": [
        "Capture the abusive content with URLs and timestamps before it is deleted.",
        "Use platform reporting and restriction tools; you do not have to reply to report.",
        "Limit who can comment or message you while the campaign is active.",
        "Step away from the thread and ask a trusted person to help monitor it.",
    ],
    "blackmail": [
        "Do not pay and do not send further material. Payment does not end the demand.",
        "Stop negotiating, but keep the conversation preserved as evidence.",
        "Never forward intimate or manipulated material, even to ask for advice.",
        "Contact an official reporting route or a specialist helpline as soon as you can.",
    ],
    "compromise": [
        "From a device you trust, start the provider's official account recovery process.",
        "Change the password and then sign out all other active sessions.",
        "Check the recovery email and phone number and remove anything you do not recognise.",
        "Warn contacts if messages were sent from your account.",
    ],
    "exposure": [
        "Search your own name and main handles to see what is currently visible.",
        "Remove phone numbers, addresses and routine details from public fields.",
        "Switch primary social accounts to a restricted audience.",
        "Request removal of pages that publish your personal details.",
    ],
    "phishing": [
        "Do not open the link or attachment again, and do not enter credentials.",
        "Verify the request through the organisation's official app or website you type yourself.",
        "Report the message inside the platform so the sender can be actioned.",
        "If you already entered a password, change it now and revoke active sessions.",
    ],
    "other": [
        "Write down what happened while the detail is fresh, including dates and times.",
        "Preserve any messages, URLs or screenshots connected to the situation.",
        "Review your account visibility and security settings as a precaution.",
        "Speak to a trusted person or a support organisation if you feel unsafe.",
    ],
}

ACCOUNT_SECURITY = [
    "Enable two-factor authentication using an authenticator app rather than SMS where possible.",
    "Use a unique password for each important account, stored in a password manager.",
    "Review active sessions and signed-in devices, and sign out anything unfamiliar.",
    "Audit third-party apps with access to your accounts and revoke the ones you do not use.",
    "Confirm that your recovery email and phone number are current and belong only to you.",
]

EVIDENCE_PRESERVATION = [
    "Record full URLs, handles and profile IDs, not only display names which can be changed.",
    "Capture screenshots that include the surrounding context, date and time.",
    "Keep original files unchanged and store a separate copy for sharing.",
    "Generate a SHA-256 fingerprint so later copies can be compared with the original.",
    "Note who supplied each item and when you collected it.",
]

NEXT_STEPS = {
    "impersonation": [
        "Follow the platform's impersonation report through to its outcome and keep the reference number.",
        "If the account is used for fraud or threats, prepare a complaint for the official cybercrime agency.",
        "Re-run a privacy check so the material used to build the fake profile is less available.",
    ],
    "cyberstalking": [
        "Build a dated log of every contact attempt, including blocked ones.",
        "Discuss physical safety planning with a trusted person or a specialist support service.",
        "Where there is any threat to safety, contact official assistance rather than waiting.",
    ],
    "harassment": [
        "Keep reporting new accounts; coordinated campaigns usually rely on replacements.",
        "Consider a temporary reduction in public posting while the campaign is active.",
        "Seek support from a women's digital-rights organisation if the abuse is sustained.",
    ],
    "blackmail": [
        "Use the official cybercrime complaint route and a specialist helpline in parallel.",
        "Ask the platform to remove non-consensual imagery through its dedicated reporting form.",
        "Keep all communication in preserved form and avoid new engagement.",
    ],
    "compromise": [
        "Check whether the same password was used anywhere else and rotate those too.",
        "Review account activity for messages, posts or purchases you did not make.",
        "Add a recovery method that only you control and re-test the recovery flow.",
    ],
    "exposure": [
        "Repeat the exposure assessment after making changes to measure the improvement.",
        "Request removal from data-broker or people-search pages where available.",
        "Set a reminder to re-check visibility every few months.",
    ],
    "phishing": [
        "Report the sender to the platform and, for financial lures, to your bank directly.",
        "Check for mailbox forwarding rules or filters you did not create.",
        "Share the pattern with friends or colleagues who may receive the same message.",
    ],
    "other": [
        "If the behaviour continues, run a new analysis with the additional detail.",
        "Keep the response plan updated as the situation develops.",
        "Contact a support organisation if you are unsure whether something is an offence.",
    ],
}

DISCLAIMER = (
    "Preliminary guidance only. This is not a legal finding, a verified threat determination, "
    "or a substitute for advice from a qualified professional or an official agency."
)

# ---------------------------------------------------------------------------
# Response playbooks
# ---------------------------------------------------------------------------

PLAYBOOKS = {
    "impersonation": {
        "title": "Impersonation response plan",
        "summary": "Contain the fake profile, protect the trust of your contacts, and preserve what you will need if you report it.",
        "phases": [
            ("Preserve", [
                ("Save the fake profile URL, handle and profile photograph.", "Copy the full address from the browser. Display names can change; the URL and handle identify the account."),
                ("Capture screenshots of the profile and of messages sent to your contacts.", "Include the date, time and surrounding context in each capture."),
                ("Store the originals in the Evidence Vault and generate a SHA-256 fingerprint.", "Keep the original file untouched and share copies only."),
            ]),
            ("Report", [
                ("Report the fake account using the platform's official impersonation process.", "Use the dedicated impersonation form where one exists; it is reviewed differently from a generic report."),
                ("Record the report reference number and the date you submitted it.", "You will need this if you have to follow up or escalate."),
            ]),
            ("Protect", [
                ("Inform affected contacts where appropriate.", "A short factual notice on your real account prevents friends from responding to the impostor."),
                ("Review account privacy settings and limit who can see your photos and friend list.", "Impersonators rebuild profiles from publicly visible material."),
                ("Enable two-factor authentication on your genuine accounts.", "This protects the real account while the fake one is being handled."),
            ]),
        ],
    },
    "compromise": {
        "title": "Account compromise response plan",
        "summary": "Take back control in the right order: recovery, credentials, sessions, then recovery channels.",
        "phases": [
            ("Recover", [
                ("Use the official account recovery process.", "Start from the provider's own website or app, never from a link in a message."),
                ("Change the password from a trusted device.", "Use a device you believe is clean, and make the password unique to this account."),
            ]),
            ("Contain", [
                ("Revoke unfamiliar active sessions.", "A password change alone may leave an attacker signed in on another device."),
                ("Enable multi-factor authentication.", "Prefer an authenticator app over SMS where the provider supports it."),
                ("Review recovery email and phone settings.", "Remove any recovery channel you do not control, then test the recovery flow."),
            ]),
            ("Verify", [
                ("Check for messages, posts or rules you did not create.", "Look for mailbox forwarding rules and connected applications in particular."),
                ("Rotate the same password anywhere else it was reused.", "Credential stuffing relies on reuse across services."),
            ]),
        ],
    },
    "cyberstalking": {
        "title": "Cyberstalking response plan",
        "summary": "Reduce visibility, document the pattern, and prioritise physical safety over engagement.",
        "phases": [
            ("Preserve", [
                ("Preserve relevant evidence in a dated log.", "Record every attempt, including the ones you blocked, with date, time and platform."),
                ("Keep screenshots and URLs of profiles and messages.", "Capture before blocking, because content often disappears afterwards."),
            ]),
            ("Reduce visibility", [
                ("Review location-sharing and account visibility.", "Check stories, check-ins, photo metadata and shared albums."),
                ("Check connected applications and active sessions.", "Remove apps and devices you do not recognise."),
            ]),
            ("Stay safe", [
                ("Avoid confronting a potentially dangerous person.", "Confrontation frequently increases contact and can move it offline."),
                ("Seek trusted support or appropriate official assistance.", "Tell one person you trust, and contact official services if you feel physically unsafe."),
            ]),
        ],
    },
    "blackmail": {
        "title": "Blackmail and image-based abuse response plan",
        "summary": "Stop engagement, preserve safely, and reach official and specialist support quickly.",
        "phases": [
            ("Do no further harm", [
                ("Do not pay and do not continue negotiating.", "Payment confirms the pressure works and normally leads to new demands."),
                ("Avoid redistributing intimate material.", "Do not forward it, even to ask for advice; describe it instead."),
            ]),
            ("Preserve safely", [
                ("Preserve relevant messages and URLs safely.", "Keep text, handles and timestamps. Store material locally and restrict access to it."),
                ("Record the demand, the deadline and the payment route requested.", "These details are significant for an official complaint."),
            ]),
            ("Reach support", [
                ("Use the official cybercrime reporting route.", "Image-based abuse and extortion are handled through dedicated complaint channels."),
                ("Contact a specialist digital-rights helpline for support.", "They can help with platform removal requests and safety planning."),
                ("Ask the platform to remove non-consensual imagery.", "Most major platforms have a dedicated form separate from general reporting."),
            ]),
        ],
    },
    "harassment": {
        "title": "Online harassment response plan",
        "summary": "Document, restrict and report without carrying the monitoring burden alone.",
        "phases": [
            ("Preserve", [
                ("Capture abusive content with URLs and timestamps.", "Public comments can be deleted; capture before you report."),
                ("Note whether the accounts appear coordinated.", "Similar naming, timing or wording is useful context for a report."),
            ]),
            ("Restrict", [
                ("Limit who can comment, mention or message you.", "Temporary restriction reduces volume while reports are reviewed."),
                ("Mute or block repeat accounts and report each one.", "Reporting creates a record even when blocking hides the content from you."),
            ]),
            ("Support", [
                ("Ask a trusted person to help monitor and report.", "You should not have to read every message yourself."),
                ("Contact a women's digital-rights organisation if abuse is sustained.", "They can advise on escalation and provide emotional support."),
            ]),
        ],
    },
    "exposure": {
        "title": "Privacy exposure response plan",
        "summary": "Find what is visible, reduce it, and confirm the change with a re-assessment.",
        "phases": [
            ("Identify", [
                ("Search your name and main handles to see what is public.", "Use a private browsing window so results are not personalised."),
                ("List every field that exposes contact details, location or routine.", "Include bios, about pages, old posts and tagged photos."),
            ]),
            ("Reduce", [
                ("Remove phone numbers, addresses and routine details from public fields.", "Move necessary contact details to a private channel."),
                ("Restrict the audience of primary social accounts.", "Review album and tagged-photo visibility separately from profile visibility."),
                ("Request removal of pages publishing your personal details.", "Keep a copy of each removal request."),
            ]),
            ("Confirm", [
                ("Re-run the Digital Exposure Assessment.", "Compare the score before and after to confirm the change."),
                ("Set a reminder to re-check visibility periodically.", "Defaults change when platforms update their settings."),
            ]),
        ],
    },
    "phishing": {
        "title": "Phishing and suspicious message response plan",
        "summary": "Verify independently, contain any credential exposure, and report the sender.",
        "phases": [
            ("Verify", [
                ("Do not reopen the link or attachment.", "Verification must happen outside the message you received."),
                ("Contact the organisation through a channel you find yourself.", "Type the official address or use the official app."),
            ]),
            ("Contain", [
                ("If you entered a password, change it and revoke active sessions.", "Do this from a trusted device, then check for forwarding rules."),
                ("If you shared a one-time code, treat the account as compromised.", "Codes bypass two-factor protection, so session revocation matters."),
                ("If financial details were shared, contact your bank directly.", "Use the number on your card or the bank's official site."),
            ]),
            ("Report", [
                ("Report the message inside the platform.", "This helps action the sender and protects other recipients."),
                ("Share the pattern with people likely to receive the same message.", "Campaigns usually target a whole contact list or workplace."),
            ]),
        ],
    },
    "other": {
        "title": "General digital safety response plan",
        "summary": "Document clearly, reduce exposure, and keep options open while the situation develops.",
        "phases": [
            ("Document", [
                ("Write a dated account of what happened.", "Include who, what, where and when while the detail is fresh."),
                ("Preserve messages, URLs and screenshots.", "Store originals and generate fingerprints for anything you may rely on later."),
            ]),
            ("Reduce exposure", [
                ("Review account visibility and connected applications.", "Remove access you no longer need."),
                ("Enable two-factor authentication on important accounts.", "This is the single highest-value account protection step."),
            ]),
            ("Seek guidance", [
                ("Speak to a trusted person or a support organisation.", "An outside view helps decide whether escalation is needed."),
                ("Run a new analysis if the behaviour continues.", "Additional detail produces a more specific classification."),
            ]),
        ],
    },
}

PLAYBOOK_DISCLAIMER = (
    "Completing this checklist improves your preparedness and preserves your options. "
    "It does not guarantee that an attacker will stop or that an incident will be resolved."
)

# ---------------------------------------------------------------------------
# Digital exposure assessment
# ---------------------------------------------------------------------------

ASSESSMENT_QUESTIONS = [
    {
        "key": "phone_public", "weight": 10, "category": "Contact exposure", "icon": "phone",
        "question": "Is your phone number publicly visible anywhere online?",
        "help": "Public bios, marketplace listings, CV uploads, business pages or old forum posts.",
        "risky_when": True,
        "recommendation": "Remove your number from public fields and move contact to a form or a private channel.",
    },
    {
        "key": "email_public", "weight": 8, "category": "Contact exposure", "icon": "mail",
        "question": "Is your personal email address publicly visible?",
        "help": "A visible personal address attracts phishing and is often the first step in account recovery attacks.",
        "risky_when": True,
        "recommendation": "Use a separate public-facing address and keep your personal one for accounts and recovery only.",
    },
    {
        "key": "social_public", "weight": 14, "category": "Profile visibility", "icon": "users",
        "question": "Are your main social media accounts set to public?",
        "help": "Public profiles let anyone collect your photos, contacts and posts to build a picture of you.",
        "risky_when": True,
        "recommendation": "Restrict your primary accounts to approved followers and review album visibility separately.",
    },
    {
        "key": "location_shared", "weight": 16, "category": "Location safety", "icon": "pin",
        "question": "Is your location shared with people who do not need it?",
        "help": "Live location, check-ins, story maps, family trackers and photo location metadata.",
        "risky_when": True,
        "recommendation": "Turn off live location for everyone who does not need it and disable location metadata in your camera app.",
    },
    {
        "key": "routine_visible", "weight": 12, "category": "Location safety", "icon": "clock",
        "question": "Do your profiles reveal your daily routine?",
        "help": "Regular posts from the same cafe, gym, campus or commute let someone predict where you will be.",
        "risky_when": True,
        "recommendation": "Post location-revealing content after you have left, and avoid repeating identifiable routines.",
    },
    {
        "key": "unknown_apps", "weight": 12, "category": "Account access", "icon": "grid",
        "question": "Do unknown or unused applications have access to your accounts?",
        "help": "Quizzes, login-with buttons and old tools keep permissions long after you stop using them.",
        "risky_when": True,
        "recommendation": "Audit connected apps in each account's security settings and revoke everything you do not use.",
    },
    {
        "key": "no_2fa", "weight": 16, "category": "Account access", "icon": "shield",
        "question": "Is two-factor authentication missing from your important accounts?",
        "help": "Without it, a single leaked password is enough to take over an account.",
        "risky_when": True,
        "recommendation": "Enable two-factor authentication on email first, then social and banking, using an authenticator app.",
    },
    {
        "key": "passwords_reused", "weight": 12, "category": "Account access", "icon": "key",
        "question": "Do you reuse the same password across accounts?",
        "help": "One breached service then exposes every other account sharing that password.",
        "risky_when": True,
        "recommendation": "Use a password manager to give each important account a unique password, starting with email.",
    },
]

ASSESSMENT_MAX = sum(q["weight"] for q in ASSESSMENT_QUESTIONS)

SCORE_BANDS = [
    (80, "Strong", "success", "Your baseline is solid. Maintain it with periodic re-checks."),
    (60, "Moderate", "info", "A good foundation with a few exposures worth closing."),
    (40, "Elevated", "warning", "Several exposures combine to make targeting easier. Address the highest-weight items first."),
    (0, "Priority", "danger", "Multiple high-impact exposures are present. Start with location and account access."),
]

# ---------------------------------------------------------------------------
# Verified Pakistan support directory
# ---------------------------------------------------------------------------

RESOURCES = [
    {
        "id": "nccia",
        "name": "National Cyber Crime Investigation Agency (NCCIA)",
        "type": "Law enforcement",
        "icon": "scales",
        "accent": "purple",
        "purpose": "Federal agency for investigating cybercrime, including online harassment, impersonation, blackmail and image-based abuse.",
        "website": "https://www.nccia.gov.pk/",
        "report_url": "https://complaint.nccia.gov.pk/",
        "report_label": "Online cybercrime complaint portal",
        "contacts": [],
        "guidance": "Prepare profile URLs, screenshots, dates and any report reference numbers before you file. Use the official online complaint portal, or visit a regional cybercrime reporting centre.",
        "tags": ["cybercrime", "harassment", "impersonation", "blackmail", "stalking", "official"],
        "verified": "Official agency website and complaint portal",
    },
    {
        "id": "pkcert",
        "name": "National CERT Pakistan (PKCERT)",
        "type": "Technical response",
        "icon": "radar",
        "accent": "violet",
        "purpose": "National Cyber Emergency Response Team: incident management, forensic and malware analysis, security awareness and capacity building.",
        "website": "https://pkcert.gov.pk/",
        "report_url": "https://pkcert.gov.pk/report-incident.asp",
        "report_label": "Report a cybersecurity incident",
        "contacts": [
            {"label": "Phone", "value": "+92 51 1111 62378", "href": "tel:+9251111162378"},
            {"label": "Email", "value": "info@pkcert.gov.pk", "href": "mailto:info@pkcert.gov.pk"},
        ],
        "guidance": "Use this route for account compromise, malware, suspicious links and technical incidents. For criminal complaints against a person, use the NCCIA complaint portal.",
        "tags": ["account compromise", "phishing", "malware", "technical", "official", "learning"],
        "verified": "Published on pkcert.gov.pk",
    },
    {
        "id": "drf",
        "name": "Digital Rights Foundation — Cyber Harassment Helpline",
        "type": "Women's support",
        "icon": "heart",
        "accent": "success",
        "purpose": "Confidential support for people facing online harassment, blackmail and image-based abuse, including digital security advice and referral.",
        "website": "https://digitalrightsfoundation.pk/",
        "report_url": "https://digitalrightsfoundation.pk/cyber-harassment-helpline/",
        "report_label": "Cyber Harassment Helpline",
        "contacts": [
            {"label": "Toll-free helpline", "value": "0800-39393", "href": "tel:080039393"},
            {"label": "Helpline email", "value": "helpdesk@digitalrightsfoundation.pk", "href": "mailto:helpdesk@digitalrightsfoundation.pk"},
        ],
        "guidance": "A good first call if you are unsure whether what happened is a crime, or you need help with platform removal requests and safety planning before filing formally.",
        "tags": ["harassment", "blackmail", "image-based abuse", "support", "women", "helpline"],
        "verified": "Published on digitalrightsfoundation.pk",
    },
    {
        "id": "pcsw",
        "name": "Punjab Women Helpline (PCSW / Women Development Department)",
        "type": "Women's support",
        "icon": "shield-heart",
        "accent": "violet",
        "purpose": "Round-the-clock toll-free support for women facing violence, harassment or injustice, with an all-women call team and referral to services.",
        "website": "https://wdd.punjab.gov.pk/helpline",
        "report_url": "https://pcsw.punjab.gov.pk/important_helplines",
        "report_label": "Official helpline directory",
        "contacts": [
            {"label": "Toll-free (24/7)", "value": "1043", "href": "tel:1043"},
        ],
        "guidance": "Use for guidance and referral on harassment, workplace injustice or violence. The number is published by the Women Development Department, Government of Punjab.",
        "tags": ["women", "harassment", "support", "helpline", "punjab", "official"],
        "verified": "Published on wdd.punjab.gov.pk and pcsw.punjab.gov.pk",
    },
    {
        "id": "mohr",
        "name": "Ministry of Human Rights Helpline",
        "type": "Government",
        "icon": "building",
        "accent": "purple",
        "purpose": "Federal human-rights helpline for guidance and referral on rights violations, including complaints relating to women's rights.",
        "website": "https://www.mohr.gov.pk/",
        "report_url": "https://www.mohr.gov.pk/",
        "report_label": "Ministry of Human Rights",
        "contacts": [
            {"label": "Toll-free helpline", "value": "1099", "href": "tel:1099"},
            {"label": "Email", "value": "helpline@mohr.gov.pk", "href": "mailto:helpline@mohr.gov.pk"},
        ],
        "guidance": "Use for advice on rights violations and referral to the appropriate authority when you are unsure which agency handles your situation.",
        "tags": ["rights", "government", "helpline", "official", "referral"],
        "verified": "Published on mohr.gov.pk",
    },
    {
        "id": "ncsw",
        "name": "National Commission on the Status of Women (NCSW)",
        "type": "Government",
        "icon": "landmark",
        "accent": "violet",
        "purpose": "Federal statutory body reviewing policy and complaints relating to the status and rights of women in Pakistan.",
        "website": "https://ncsw.gov.pk/",
        "report_url": "https://ncsw.gov.pk/",
        "report_label": "NCSW complaints information",
        "contacts": [],
        "guidance": "Use the commission's published complaints route for policy-level and rights concerns. For an active cybercrime, file with NCCIA first.",
        "tags": ["women", "rights", "government", "policy", "official"],
        "verified": "Official commission website",
    },
    {
        "id": "emergency",
        "name": "Emergency services",
        "type": "Emergency",
        "icon": "siren",
        "accent": "danger",
        "purpose": "Immediate assistance when there is a threat to physical safety. Online threats that reference real-world harm belong here first.",
        "website": "https://pcsw.punjab.gov.pk/important_helplines",
        "report_url": "https://pcsw.punjab.gov.pk/important_helplines",
        "report_label": "Official helpline directory",
        "contacts": [
            {"label": "Police emergency", "value": "15", "href": "tel:15"},
            {"label": "Rescue service", "value": "1122", "href": "tel:1122"},
            {"label": "Child protection", "value": "1121", "href": "tel:1121"},
        ],
        "guidance": "If you believe you are in immediate physical danger, contact emergency services before completing any online reporting. Numbers as published in the Government of Punjab helpline directory.",
        "tags": ["emergency", "safety", "police", "rescue", "official"],
        "verified": "Published on pcsw.punjab.gov.pk",
    },
    {
        "id": "vwps",
        "name": "Violence Against Women Police Station network (Punjab Safe Cities Authority)",
        "type": "Law enforcement",
        "icon": "badge",
        "accent": "purple",
        "purpose": "Police assistance for women, with female officers receiving complaints and dispatching support through the police emergency line.",
        "website": "https://vwps.psca.gop.pk/contact-us",
        "report_url": "https://vwps.psca.gop.pk/contact-us",
        "report_label": "Contact VWPS",
        "contacts": [
            {"label": "Police emergency", "value": "15", "href": "tel:15"},
            {"label": "Email", "value": "info@psca.gop.pk", "href": "mailto:info@psca.gop.pk"},
        ],
        "guidance": "Published guidance: call the police emergency line and request the women's support option. Use when online threats have moved into physical space.",
        "tags": ["police", "women", "emergency", "punjab", "official"],
        "verified": "Published on vwps.psca.gop.pk",
    },
]

RESOURCE_TYPES = ["Law enforcement", "Technical response", "Women's support", "Government", "Emergency"]

# ---------------------------------------------------------------------------
# Learning module (feeds the "learning activities completed" impact indicator)
# ---------------------------------------------------------------------------

QUIZ = [
    {
        "q": "A message says your account will be closed in 24 hours unless you confirm your password through a link. What is the safest response?",
        "options": [
            "Open the link and check whether the page looks official",
            "Ignore the link and check your account through the official app or an address you type yourself",
            "Reply asking the sender to prove who they are",
        ],
        "answer": 1,
        "why": "Urgency plus a credential request is the classic phishing pattern. Verification must happen on a channel you opened independently.",
    },
    {
        "q": "Someone is threatening to publish private images unless you pay. What should you do first?",
        "options": [
            "Pay once and ask them to delete the material",
            "Forward the images to a friend so there is a backup",
            "Stop engaging, preserve the messages and URLs, and contact an official reporting route or specialist helpline",
        ],
        "answer": 2,
        "why": "Payment confirms the pressure works and usually leads to further demands. Intimate material must never be redistributed, even for advice.",
    },
    {
        "q": "You changed your password after a suspicious login. What else is essential?",
        "options": [
            "Sign out all other active sessions and check recovery email and phone settings",
            "Nothing, a new password removes everyone else",
            "Delete the account immediately",
        ],
        "answer": 0,
        "why": "An existing session can survive a password change, and a recovery channel the attacker controls lets them take the account back.",
    },
    {
        "q": "What does a matching SHA-256 hash actually tell you about a screenshot in your Evidence Vault?",
        "options": [
            "That the allegation in the screenshot is true",
            "That the file is byte-for-byte the same as when it was fingerprinted",
            "That the file was uploaded to a government server",
        ],
        "answer": 1,
        "why": "A hash is an integrity check on the file only. It says nothing about whether the content is authentic or the allegation is true.",
    },
]

DEMO_INCIDENT = {
    "category": "impersonation",
    "platform": "Instagram",
    "description": (
        "Someone created a fake social media account using my pictures and is messaging my friends. "
        "The profile uses my name and my photographs, and two friends have already replied to it. "
        "I have not contacted the account."
    ),
}

DEMO_EVIDENCE_TEXT = (
    "CYBERAURA demonstration evidence record\n"
    "---------------------------------------\n"
    "Incident: impersonation using photographs (fictional sample)\n"
    "Captured: profile URL, handle and message thread\n"
    "This file contains no real personal data. It exists so the SHA-256\n"
    "fingerprint and integrity verification flow can be demonstrated safely.\n"
)

# ---------------------------------------------------------------------------
# Women's Safety Feedback & Resource Hub
# ---------------------------------------------------------------------------

HUB_CHALLENGE_CATEGORIES = [
    "Impersonation / fake profiles",
    "Online harassment or threats",
    "Image-based abuse",
    "Blackmail / sextortion",
    "Phishing / account compromise",
    "Privacy gaps / data exposure",
    "Platform reporting failures",
    "Other",
]

HUB_SUGGESTION_CATEGORIES = [
    "Safety guidance",
    "Platform features",
    "Resources & helplines",
    "Learning & awareness",
    "Accessibility",
    "Other",
]

BEGINNER_GUIDES = [
    {
        "id": "lockdown",
        "icon": "lock",
        "title": "Lock down your main account in 10 minutes",
        "minutes": 10,
        "steps": [
            "Open your account settings and set your profile to private or friends-only.",
            "Remove your phone number and personal email from public view.",
            "Turn on two-factor authentication so a password alone is not enough.",
            "Review the list of logged-in devices and sign out of anything you do not recognise.",
            "Go through your friends or followers and remove accounts you do not know.",
        ],
        "tip": "Do one platform at a time. Starting with the account you use most gives you the biggest safety gain first.",
    },
    {
        "id": "impersonation",
        "icon": "masks",
        "title": "If someone is impersonating you",
        "minutes": 8,
        "steps": [
            "Do not message the fake account or argue with it publicly.",
            "Screenshot the profile, its posts and any messages, with dates visible.",
            "Copy the profile URL and save it somewhere safe (the Evidence Vault can fingerprint it).",
            "Report the profile to the platform as impersonation.",
            "If there are threats or your images are misused, file a complaint with NCCIA and tell someone you trust.",
        ],
        "tip": "Evidence gathered before you report is far stronger than evidence gathered after the account disappears.",
    },
    {
        "id": "image-abuse",
        "icon": "image",
        "title": "If a private image is shared without consent",
        "minutes": 9,
        "steps": [
            "Remember: this is not your fault, and you have options.",
            "Do not delete the original message or file — it is evidence.",
            "Save URLs and screenshots, then fingerprint them in the Evidence Vault.",
            "Ask the platform to remove the content using its non-consensual imagery report form.",
            "Contact the Digital Rights Foundation helpline for confidential support, and report to NCCIA.",
        ],
        "tip": "You do not have to handle this alone. The helpline can help with removal requests and safety planning before you file formally.",
    },
    {
        "id": "phishing",
        "icon": "hook",
        "title": "Spot and stop a phishing message",
        "minutes": 6,
        "steps": [
            "Pause. Urgency (\"act now or lose access\") is the biggest warning sign.",
            "Check the sender's actual address or number, not just the display name.",
            "Do not tap links or open attachments in unexpected messages.",
            "Open the official app or type the website yourself to check if the alert is real.",
            "If you already clicked and entered a password, change it now and enable two-factor.",
        ],
        "tip": "When in doubt, verify through a channel you choose yourself — never the one the message provides.",
    },
]

LEARNING_RESOURCES = [
    {
        "id": "passwords",
        "icon": "key",
        "title": "Passwords that actually protect you",
        "level": "Beginner",
        "minutes": 5,
        "accent": "purple",
        "summary": "Why reuse is the real danger, and how a password manager removes the memory burden.",
        "body": [
            "Reusing one password across accounts means a single breach unlocks everything. Attackers try leaked email-and-password pairs on every popular service automatically.",
            "A strong password is long rather than clever: a passphrase of four or more random words beats a short string of symbols.",
            "A password manager generates and stores a unique password per account, so you only remember one master passphrase.",
        ],
        "actions": [
            "Give your email and banking unique passphrases first.",
            "Turn on a password manager and migrate one account at a time.",
            "Never share a password or one-time code, even with someone claiming to be support.",
        ],
    },
    {
        "id": "two-factor",
        "icon": "shield-check",
        "title": "Two-factor authentication, explained simply",
        "level": "Beginner",
        "minutes": 4,
        "accent": "success",
        "summary": "What 2FA blocks, which method to prefer, and the backup-code habit that saves you.",
        "body": [
            "Two-factor authentication (2FA) requires something you have (a code or key) in addition to your password, so a stolen password alone is not enough.",
            "Authenticator apps and hardware keys are stronger than SMS codes, which can be intercepted or SIM-swapped.",
            "Backup codes let you regain access if you lose your device — store them offline, not in your email.",
        ],
        "actions": [
            "Enable 2FA on email first; it protects every account that uses email for resets.",
            "Prefer an authenticator app over SMS where offered.",
            "Save backup codes somewhere safe and separate from your phone.",
        ],
    },
    {
        "id": "visibility",
        "icon": "eye",
        "title": "Control who can see your life",
        "level": "Beginner",
        "minutes": 6,
        "accent": "violet",
        "summary": "Audits of profile visibility, friend lists and old posts that quietly expose you.",
        "body": [
            "Most exposure comes from defaults: public profiles, open friend lists and years-old posts still visible to everyone.",
            "Location tags and routine check-ins let someone predict where you will be — post after you leave, not while you are there.",
            "Review what strangers see by viewing your own profile logged out or in a private window.",
        ],
        "actions": [
            "Set default audience for future posts to friends-only.",
            "Hide your friend list and contact details from public view.",
            "Bulk-limit or remove old public posts you would not share today.",
        ],
    },
    {
        "id": "evidence",
        "icon": "fingerprint",
        "title": "Preserve evidence that holds up",
        "level": "Intermediate",
        "minutes": 7,
        "accent": "info",
        "summary": "What to capture, how hashing proves integrity, and what a hash does NOT prove.",
        "body": [
            "Capture screenshots with dates and URLs visible, plus the full message thread and profile handle, before reporting or blocking.",
            "A SHA-256 fingerprint lets you later prove a file is byte-for-byte unchanged since you saved it.",
            "A matching hash proves integrity only — it does not prove an allegation is true or that content is authentic.",
        ],
        "actions": [
            "Save evidence to the browser-local Vault and fingerprint each item.",
            "Keep originals; do not edit or crop the only copy.",
            "Re-verify integrity before sharing evidence with a helpline or authority.",
        ],
    },
    {
        "id": "reporting",
        "icon": "scales",
        "title": "Choose the right reporting route",
        "level": "Intermediate",
        "minutes": 6,
        "accent": "warning",
        "summary": "Platform vs technical vs criminal vs support: who handles what, and in which order.",
        "body": [
            "Platform reports remove content and accounts; they do not investigate crimes.",
            "Technical incidents (compromise, malware, suspicious links) go to National CERT; criminal complaints against a person go to NCCIA.",
            "Support helplines help you safety-plan and prepare before formal filing, and can accompany you through removal requests.",
        ],
        "actions": [
            "Preserve evidence first, then report to the platform.",
            "Use NCCIA for impersonation, harassment, blackmail and image-based abuse.",
            "Call a women's helpline if you are unsure whether what happened is a crime.",
        ],
    },
    {
        "id": "coercion",
        "icon": "heart",
        "title": "Recognise coercion and manipulation",
        "level": "Beginner",
        "minutes": 5,
        "accent": "danger",
        "summary": "Grooming, pressure and sextortion patterns — and why responding to threats rarely helps.",
        "body": [
            "Coercion often starts with flattery or secrecy, then escalates to pressure for images, money or compliance.",
            "Sextortion threats rely on fear and isolation; paying or complying usually increases demands.",
            "Telling one trusted person or a confidential helpline breaks the isolation the attacker depends on.",
        ],
        "actions": [
            "Stop responding; do not pay or send more content.",
            "Preserve the thread and report to the platform and NCCIA.",
            "Reach out to a helpline or trusted person the same day.",
        ],
    },
]

REPORT_SITUATIONS = [
    {
        "id": "impersonation",
        "label": "Fake profile / impersonation",
        "icon": "masks",
        "first": "Preserve the profile URL and screenshots before reporting, so evidence survives if the account is removed.",
        "resources": ["nccia", "drf"],
        "steps": [
            "Screenshot profile, posts and messages with dates; copy the profile URL.",
            "Report to the platform as impersonation.",
            "File a complaint with NCCIA if there are threats or misuse of your images.",
        ],
    },
    {
        "id": "harassment",
        "label": "Harassment or threats",
        "icon": "alert",
        "first": "If any message references real-world harm or you feel physically unsafe, contact emergency services (15 / 1122) first.",
        "resources": ["nccia", "drf", "pcsw"],
        "steps": [
            "Do not engage; mute or block after preserving evidence.",
            "Save the thread and any identifying details of the sender.",
            "Report to NCCIA and contact a women's helpline for support and safety planning.",
        ],
    },
    {
        "id": "image-abuse",
        "label": "Private images shared",
        "icon": "image",
        "first": "This is not your fault. Keep the original message as evidence and seek confidential support before deciding next steps.",
        "resources": ["drf", "nccia", "pcsw"],
        "steps": [
            "Preserve URLs and screenshots; fingerprint them in the Vault.",
            "Use the platform's non-consensual imagery removal form.",
            "Contact the Digital Rights Foundation helpline and report to NCCIA.",
        ],
    },
    {
        "id": "blackmail",
        "label": "Blackmail / sextortion",
        "icon": "lock",
        "first": "Do not pay or send more content. Payment rarely stops demands; preserving evidence and reporting does more.",
        "resources": ["nccia", "drf"],
        "steps": [
            "Stop responding and preserve the full thread.",
            "Report the account to the platform and to NCCIA.",
            "Tell a trusted person or helpline the same day to break isolation.",
        ],
    },
    {
        "id": "phishing",
        "label": "Phishing / hacked account",
        "icon": "hook",
        "first": "Regain control of your email first — it is the reset path for everything else.",
        "resources": ["pkcert", "nccia"],
        "steps": [
            "Change passwords from a clean device and enable two-factor.",
            "Report the incident to National CERT for technical response.",
            "Report any fraud or impersonation to NCCIA and warn contacts.",
        ],
    },
    {
        "id": "unsure",
        "label": "Not sure where to start",
        "icon": "compass",
        "first": "You do not need to classify what happened to get help. A confidential helpline can listen and point you to the right route.",
        "resources": ["drf", "pcsw"],
        "steps": [
            "Write down what happened in your own words, with dates.",
            "Call a women's helpline to talk it through confidentially.",
            "Follow their referral to platform, technical or criminal reporting as needed.",
        ],
    },
]