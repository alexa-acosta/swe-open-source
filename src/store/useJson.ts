import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
import { set as setByPath } from "lodash";
import useFile from "./useFile";
interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateJsonValue: (pathSegments: (string | number)[], newValue: any) => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    set({ json, loading: false });
    useFile.getState().setContents({ contents: json });
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },

updateJsonValue: (pathSegments: (string | number)[], newValue: any) => {
    const currentJsonString = get().json;

    try {
      if (!pathSegments || pathSegments.length === 0) {
          const newJsonString = JSON.stringify(newValue, null, 2);
          get().setJson(newJsonString);
          return;
      }
      
      const currentObject = JSON.parse(currentJsonString);
      
      const newObject = setByPath({ ...currentObject }, pathSegments, newValue); 
      
      const newJsonString = JSON.stringify(newObject, null, 2); 
      get().setJson(newJsonString); 
      
    } catch (error) {
      console.error("Failed to update JSON value at path:", pathSegments, error);
    }
}
}));

export default useJson;