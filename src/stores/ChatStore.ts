import { Message } from "@/context/ChatContext";
import { FeatureEntry } from "@/settings/SettingsPage";
import { makeAutoObservable } from "mobx";

class ChatStore {
  messages: Message[] = [];
  suggestQuestions: string[] = [];
  currentFeature: FeatureEntry = {
    id: "",
    name: "",
    systemPrompt: "",
    instruction: "",
    enabled: false,
    icon: "",
    enableReasoning: false
  };
  defaultFeatureId: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  setSuggestQuestions(questions: string[]) {
    this.suggestQuestions = questions;
  }

  clearSuggestQuestions() {
    this.suggestQuestions = [];
  }

  setCurrentFeature(feature: FeatureEntry) {
    this.currentFeature = feature;
  }

  setUseReasoningCurrentFeature(value: boolean) {
    if (this.currentFeature) {
      this.currentFeature.enableReasoning = value;
    }
    else{
      this.currentFeature = {
        id: "",
        name: "",
        systemPrompt: "",
        instruction: "",
        enabled: false,
        icon: "",
        enableReasoning: value
      };
    }
  }

  // setMessage(messages: Message[]) {
  //   this.messages = messages;
  // }

  setMessages(cb: (messages: Message[]) => Message[]) {
    cb && (this.messages = cb(this.messages));
  }

  setDefaultFeatureId(id: string) {
    this.defaultFeatureId = id;
  }
}

export const chatStore = new ChatStore(); 