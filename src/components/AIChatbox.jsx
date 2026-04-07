import { useEffect, useMemo, useRef, useState } from "react";

const chatKey = "shopx:ai-chat";
const openKey = "shopx:ai-chat-open";
const languageKey = "shopx:ai-chat-language";
const audioKey = "shopx:ai-chat-audio";

const getBrowserApis = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  return {
    SpeechRecognition,
    speechSynthesis: window.speechSynthesis || null,
  };
};

const replies = {
  en: {
    welcome:
      "Hi, I am your ShopX AI helper. I can help with cart, wishlist, group buy, coins, checkout, delivery, and product search.",
    fallback:
      "I can help with ShopX features like cart, wishlist, group buy, coins, checkout, delivery, profile, admin panel, and search.",
    group:
      "Group Buy lets different users join the same product deal. The count increases only once per user now, and when 5 unique users join, the extra 15% group discount unlocks.",
    coin:
      "You earn reward coins after successful orders. You can use those coins during checkout to reduce the final amount.",
    cart:
      "Products added to cart appear in the cart and profile with image, quantity controls, and remove options.",
    wishlist:
      "Wishlist products are saved separately so users can quickly revisit and remove them anytime.",
    search:
      "Type in the search bar to see related products with image and title. Your latest 5 searches are also saved for quick reuse.",
    checkout:
      "Orders can be placed only after delivery details are filled. Purchase history saves order time, address, payment method, and bought items.",
    admin:
      "Admin users can open the Admin Panel to add, edit, delete products, and manage pricing and discounts.",
    language:
      "You can switch between Hindi and English from the chat header. Audio mode can also be turned on for voice input and spoken replies.",
    unsupportedMic: "Voice input is not supported in this browser.",
    helpTitle: "Instant Help",
    helpSubtitle: "Ask about shopping, cart, checkout, or group buy",
    audioOn: "Audio On",
    audioOff: "Audio Off",
    micOn: "Listening",
    mic: "Mic",
    send: "Send",
    close: "Close Help",
    open: "AI Help",
    placeholder: "Ask about cart, coins, group buy...",
    quickActions: [
      "How does Group Buy work?",
      "How do coins work?",
      "Where is my cart?",
    ],
  },
  hi: {
    welcome:
      "नमस्ते, मैं आपका ShopX AI helper हूँ। मैं cart, wishlist, group buy, coins, checkout, delivery और product search में मदद कर सकता हूँ।",
    fallback:
      "मैं ShopX के cart, wishlist, group buy, coins, checkout, delivery, profile, admin panel और search features में मदद कर सकता हूँ।",
    group:
      "Group Buy में अलग users same product deal join करते हैं। अब एक user सिर्फ एक बार join करेगा, और 5 unique users होने पर extra 15% group discount unlock होगा।",
    coin:
      "Successful order के बाद reward coins मिलते हैं। Checkout के time ये coins use करके final amount कम कर सकते हो।",
    cart:
      "Cart में add किए गए products image, quantity controls और remove option के साथ cart और profile में दिखते हैं।",
    wishlist:
      "Wishlist products अलग save होते हैं, जिससे user उन्हें बाद में जल्दी से देख या remove कर सके।",
    search:
      "Search bar में type करते ही related products image और title के साथ दिखते हैं। Last 5 searches भी save रहते हैं।",
    checkout:
      "Delivery details fill किए बिना order place नहीं होगा। Purchase history में order time, address, payment method और purchased items save होते हैं।",
    admin:
      "Admin users Admin Panel खोल कर products add, edit, delete और pricing-discount manage कर सकते हैं।",
    language:
      "Chat header से हिंदी और English switch कर सकते हो। Audio mode on करके mic input और voice reply भी use कर सकते हो।",
    unsupportedMic: "इस browser में voice input support नहीं है।",
    helpTitle: "तुरंत मदद",
    helpSubtitle: "Shopping, cart, checkout या group buy के बारे में पूछें",
    audioOn: "आवाज चालू",
    audioOff: "आवाज बंद",
    micOn: "सुन रहा है",
    mic: "माइक",
    send: "भेजें",
    close: "मदद बंद करें",
    open: "AI मदद",
    placeholder: "Cart, coins, group buy के बारे में पूछें...",
    quickActions: [
      "Group Buy कैसे काम करता है?",
      "Coins कैसे मिलते हैं?",
      "मेरा cart कहाँ है?",
    ],
  },
};

const includesAny = (input, terms) => terms.some((term) => input.includes(term));

const getReply = (message, language) => {
  const input = message.toLowerCase().trim();
  const dictionary = replies[language] || replies.en;

  if (
    includesAny(input, [
      "group",
      "group buy",
      "buy together",
      "join",
      "ग्रुप",
      "जॉइन",
      "जुड़",
      "डिस्काउंट",
    ])
  ) {
    return dictionary.group;
  }

  if (includesAny(input, ["coin", "coins", "reward", "कॉइन", "रिवॉर्ड"])) {
    return dictionary.coin;
  }

  if (includesAny(input, ["cart", "कार्ट", "bag", "बैग"])) {
    return dictionary.cart;
  }

  if (includesAny(input, ["wishlist", "विशलिस्ट", "saved", "wish list"])) {
    return dictionary.wishlist;
  }

  if (
    includesAny(input, [
      "search",
      "filter",
      "product",
      "products",
      "सर्च",
      "खोज",
      "ढूंढ",
      "ढूँढ",
    ])
  ) {
    return dictionary.search;
  }

  if (
    includesAny(input, [
      "checkout",
      "delivery",
      "address",
      "purchase",
      "order",
      "ऑर्डर",
      "डिलीवरी",
      "पता",
      "खरीद",
    ])
  ) {
    return dictionary.checkout;
  }

  if (includesAny(input, ["admin", "एडमिन"])) {
    return dictionary.admin;
  }

  if (
    includesAny(input, [
      "language",
      "hindi",
      "english",
      "audio",
      "voice",
      "mic",
      "भाषा",
      "हिंदी",
      "इंग्लिश",
      "आवाज",
      "माइक",
    ])
  ) {
    return dictionary.language;
  }

  return dictionary.fallback;
};

const AIChatbox = () => {
  const containerRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastSpokenMessageRef = useRef("");
  const [open, setOpen] = useState(() => localStorage.getItem(openKey) === "true");
  const [language, setLanguage] = useState(
    () => localStorage.getItem(languageKey) || "en"
  );
  const [audioEnabled, setAudioEnabled] = useState(
    () => localStorage.getItem(audioKey) === "true"
  );
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(chatKey);
      return saved ? JSON.parse(saved) : [{ role: "assistant", content: replies.en.welcome }];
    } catch (error) {
      console.error(error);
      return [{ role: "assistant", content: replies.en.welcome }];
    }
  });

  const dictionary = replies[language] || replies.en;
  const quickActions = useMemo(() => dictionary.quickActions, [dictionary]);

  useEffect(() => {
    localStorage.setItem(chatKey, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(openKey, String(open));
  }, [open]);

  useEffect(() => {
    localStorage.setItem(languageKey, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(audioKey, String(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    const { speechSynthesis } = getBrowserApis();
    if (!audioEnabled || !speechSynthesis) {
      return;
    }

    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");

    if (!lastAssistantMessage || lastAssistantMessage.content === lastSpokenMessageRef.current) {
      return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.content);
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    speechSynthesis.speak(utterance);
    lastSpokenMessageRef.current = lastAssistantMessage.content;
  }, [audioEnabled, language, messages]);

  useEffect(() => {
    return () => {
      const { speechSynthesis } = getBrowserApis();
      speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  const sendMessage = (text) => {
    const value = text.trim();
    if (!value) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: value },
      { role: "assistant", content: getReply(value, language) },
    ]);
    setInput("");
    setOpen(true);
  };

  const toggleListening = () => {
    const { SpeechRecognition } = getBrowserApis();

    if (!SpeechRecognition) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: dictionary.unsupportedMic },
      ]);
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      setInput(transcript);

      if (event.results[event.results.length - 1]?.isFinal && transcript) {
        sendMessage(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-5 sm:left-auto sm:right-5 sm:w-auto">
      {open && (
        <div className="flex h-[min(72vh,640px)] w-full max-w-[440px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#08101d] shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:w-[420px]">
          <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/20 via-sky-400/10 to-blue-500/20 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">
                  ShopX AI
                </p>
                <h3 className="mt-1 text-xl font-semibold">{dictionary.helpTitle}</h3>
                <p className="mt-1 text-sm text-slate-300">{dictionary.helpSubtitle}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    language === "en"
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-white/10 text-slate-200"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("hi")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    language === "hi"
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-white/10 text-slate-200"
                  }`}
                >
                  हिं
                </button>
              </div>
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === "assistant"
                    ? "mr-auto bg-white/10 text-slate-100"
                    : "ml-auto bg-cyan-400 text-slate-950"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 bg-[#0a1322] px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setAudioEnabled((current) => !current)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  audioEnabled
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-white/10 text-slate-200"
                }`}
              >
                {audioEnabled ? dictionary.audioOn : dictionary.audioOff}
              </button>

              {listening && (
                <span className="text-xs font-medium text-amber-200">
                  {dictionary.micOn}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage(input);
                  }
                }}
                placeholder={dictionary.placeholder}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500"
              />
              <button
                onClick={toggleListening}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  listening
                    ? "bg-amber-300 text-slate-950"
                    : "border border-white/10 text-slate-100"
                }`}
              >
                {dictionary.mic}
              </button>
              <button
                onClick={() => sendMessage(input)}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                {dictionary.send}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((current) => !current)}
        className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg"
      >
        {open ? dictionary.close : dictionary.open}
      </button>
    </div>
  );
};

export default AIChatbox;
