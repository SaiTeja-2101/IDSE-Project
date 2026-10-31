// Hire and Seek copy. Original source and authors are credited in docs/UPSTREAM.md.
const english = {
    "header": {
        "title": "Hire and Seek",
        "subtitle": "You hire. It learns."
    },
    "about": {
        "aboutBody": "Hire and Seek is a game about learning from past hiring choices. Adapted from Survival of the Best Fit by Alia ElKattan, Miha Klasinc, Gabor Csapo, and Jihyun Kim."
    },
    "resources": {
        "title": "Machines, Bias, and Fairness",
        "aboutBiasTitle": "How does 'machine bias' work?",
        "aboutBias": "xx\n xxx"
    },
    "titleStage": {
        "header": "Hire & Seek",
        "instruction": "A new job. A stack of CVs. A machine that learns from you. What could go wrong?",
        "responses": [
            "Start →"
        ]
    },
    "instructions": {
        "manual": {
            "click": "Choose a person to read their CV.",
            "eval": "Read the CV. Then choose Accept or Reject."
        },
        "ml": {}
    },
    "smallOfficeStage": {
        "subject": "Welcome to Orbit Works",
        "messageFromVc": "You are our new recruiter. Read each CV and hire three people. Take your time with this first round.",
        "responses": [
            "Let me see the CVs"
        ],
        "hiringGoal": 3
    },
    "mediumOfficeStage": {
        "subject": "The queue is growing",
        "messageFromVc": "Five more roles to fill. Keep reading the CVs as the queue grows. You can pause at any time.",
        "responses": [
            "Back to the hiring desk",
            "Let me take a look"
        ],
        "hiringGoal": 5,
        "duration": 45
    },
    "largeOfficeStage": {
        "subject": "One more round",
        "messageFromVc": "Eight more hires before we hand the desk to Scout. What do you look for in a CV?",
        "responses": [
            "Let me try",
            "That is a lot of CVs"
        ],
        "hiringGoal": 8,
        "previousStageFailed": "The clock ran out. We still have roles to fill. Read the next CVs and keep going.",
        "duration": 45
    },
    "mlTransition": {
        "subject": "Meet Scout",
        "messageFromVc": "Our team built Scout to help screen CVs. Talk to Maya, our engineer, and find out how it learns.",
        "responses": [
            "How does Scout learn?",
            "Let me talk to Maya"
        ],
        "previousStageFailed": "That was a busy round. Our team built Scout to help. Talk to Maya and find out how it learns."
    },
    "conversation": [
        {
            "dialogue_step": 1,
            "text": "Hi, I am Maya. We built Scout to help with hiring. It can learn patterns from examples of past decisions.",
            "answer_choice": [
                {
                    "text": "How does that work?",
                    "response": ""
                },
                {
                    "text": "Tell me more",
                    "response": ""
                }
            ]
        },
        {
            "dialogue_step": 2,
            "text": "Each example has a CV and a decision: hired or rejected. Scout uses these examples to learn which details go with each decision.",
            "answer_choice": [
                {
                    "text": "So it copies past choices?",
                    "response": "Yes. "
                },
                {
                    "text": "Does it know who can do the job?",
                    "response": "Not on its own. "
                }
            ]
        },
        {
            "dialogue_step": 3,
            "text": "A past hiring choice is not the same as proof of skill. We need to check what those choices teach Scout.",
            "answer_choice": [
                {
                    "text": "Where do we start?",
                    "response": ""
                },
                {
                    "text": "Show me the examples",
                    "response": ""
                }
            ]
        },
        {
            "dialogue_step": 4,
            "text": "Click <b>cv_all.zip</b> in the file list. It holds the CVs and decisions from your hiring rounds.",
            "file_drag": true,
            "answer_choice": []
        },
        {
            "dialogue_step": 5,
            "text": "We also have three sets of older company records. Choose one to add to your examples. We should check these records too.",
            "dataset_choice": true,
            "answer_choice": [
                "Archive A",
                "Archive B",
                "Archive C"
            ]
        },
        {
            "dialogue_step": 6,
            "text": "The records are ready. Let us train Scout and watch its choices.",
            "answer_choice": [
                {
                    "text": "Train Scout",
                    "response": ""
                }
            ]
        }
    ],
    "stats_conversation": [
        {
            "dialogue_step": 1,
            "text": "Let us compare Scout's choices for applicants from the two cities.",
            "answer_choice": [
                {
                    "text": "Show Bengaluru and Chennai",
                    "response": ""
                }
            ]
        },
        {
            "dialogue_step": 2,
            "text": "These numbers come from the decisions recorded in this run. Who was accepted and who was rejected?",
            "stats": true,
            "answer_choice": [
                {
                    "text": "The cities have different results.",
                    "response": ""
                },
                {
                    "text": "I need a closer look.",
                    "response": ""
                }
            ]
        },
        {
            "dialogue_step": 3,
            "text": "Scout learned from past hiring choices. Those choices may carry patterns we did not mean to teach.",
            "answer_choice": [
                {
                    "text": "We gave it the examples.",
                    "response": ""
                },
                {
                    "text": "What should we check?",
                    "response": ""
                }
            ]
        },
        {
            "dialogue_step": 5,
            "text": "Here is a summary of the earlier hiring rounds.",
            "stats": true,
            "manualStats": true,
            "answer_choice": [
                {
                    "text": "Compare the two cities.",
                    "response": ""
                },
                {
                    "text": "Check which examples we used.",
                    "response": ""
                }
            ]
        },
        {
            "dialogue_step": 6,
            "text": "Hiding a city name may not remove every clue. Another detail, such as a school score, may carry a similar pattern.",
            "answer_choice": [
                {
                    "text": "So another detail can act as a clue.",
                    "response": ""
                },
                {
                    "text": "We should check the records.",
                    "response": ""
                }
            ]
        },
        {
            "dialogue_step": 7,
            "text": "We need to check the labels, the examples, and the results. Using a computer does not remove that work.",
            "answer_choice": [
                {
                    "text": "Let us look back at what happened.",
                    "response": ""
                }
            ]
        }
    ],
    "mlLabStage": {
        "narration": [
            {
                "news": [
                    "Orbit Works opens its hiring desk",
                    "Scout is ready for its first shift",
                    "New CVs arrive from Bengaluru and Chennai"
                ]
            },
            {
                "messageFromVc": "Scout is screening the next CVs. It is quick. Now we need to check its choices.",
                "responses": [
                    "Let me watch"
                ],
                "news": [
                    "A faster desk, but are the choices useful?",
                    "Watch the CVs as Scout screens them"
                ]
            },
            {
                "launchCVInspector": true,
                "messageFromVc": "Elvan Yang asked how Scout read their CV. Open the CV list and take a look.",
                "responses": [
                    "Find Elvan in the CV list",
                    "Let me check the CVs"
                ],
                "inspectQuestion": "What would you check about Scout's choice?",
                "inspectResponses": [
                    "I need more evidence.",
                    "Could the city be a clue?"
                ]
            },
            {
                "breaking": true,
                "messageFromVc": "People are asking if Scout treats both cities the same. An automated choice still needs checking.",
                "responses": [
                    "Let me keep watching",
                    "We should check the results"
                ],
                "news": [
                    "Applicants ask how Scout makes its choices",
                    "Can past hiring choices shape future ones?"
                ]
            },
            {
                "launchMachineInspector": true,
                "messageFromVc": "Talk to Maya again. Compare the cities and look at the examples Scout learned from.",
                "responses": [
                    "Open the review",
                    "Let me talk to Maya"
                ],
                "inspectQuestion": "Why might the results differ by city?",
                "inspectResponses": [
                    "The past choices may favour one city.",
                    "We need to check the older records too."
                ],
                "news": [
                    "Chennai applicants ask for a closer review",
                    "Fast choices still need a closer look"
                ]
            },
            {
                "messageFromVc": "We are stopping this hiring run to review it. What should we have checked before trusting Scout?",
                "responses": [
                    "Look back at the shift"
                ],
                "news": [
                    "Orbit Works pauses hiring for a review",
                    "Better questions before the next hiring run"
                ]
            }
        ]
    },
    "selfPromoMessages": [
        "Ready for my interview!",
        "Take a look at my CV.",
        "I like solving problems.",
        "I enjoy working with a team.",
        "I learn by trying things.",
        "Is this the hiring desk?"
    ]
};

let txt = english;
let candidateClicked = 0;
let candidateInSpot = null;
if (typeof module !== "undefined") module.exports = english;
