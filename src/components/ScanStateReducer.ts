export interface ScanState {
  mediaType: 'vinyl' | 'cd' | null;
  currentStep: number;
  uploadedFiles: string[];
  selectedCondition: string;
  calculatedAdvicePrice: number | null;
  isSavingCondition: boolean;
  completedScanData: any;
  duplicateRecords: any[];
  showDuplicateDialog: boolean;
  pendingSaveData: { condition: string; advicePrice: number } | null;
}

export type ScanAction =
  | { type: 'SET_MEDIA_TYPE'; payload: 'vinyl' | 'cd' | null }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_UPLOADED_FILES'; payload: string[] }
  | { type: 'SET_SELECTED_CONDITION'; payload: string }
  | { type: 'SET_CALCULATED_ADVICE_PRICE'; payload: number | null }
  | { type: 'SET_IS_SAVING_CONDITION'; payload: boolean }
  | { type: 'SET_COMPLETED_SCAN_DATA'; payload: any }
  | { type: 'SET_DUPLICATE_RECORDS'; payload: any[] }
  | { type: 'SET_SHOW_DUPLICATE_DIALOG'; payload: boolean }
  | { type: 'SET_PENDING_SAVE_DATA'; payload: { condition: string; advicePrice: number } | null }
  | { type: 'RESET_SCAN' };

export const initialScanState: ScanState = {
  mediaType: null,
  currentStep: 1,
  uploadedFiles: [],
  selectedCondition: '',
  calculatedAdvicePrice: null,
  isSavingCondition: false,
  completedScanData: null,
  duplicateRecords: [],
  showDuplicateDialog: false,
  pendingSaveData: null,
};

export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'SET_MEDIA_TYPE':
      return { ...state, mediaType: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_UPLOADED_FILES':
      return { ...state, uploadedFiles: action.payload };
    case 'SET_SELECTED_CONDITION':
      return { ...state, selectedCondition: action.payload };
    case 'SET_CALCULATED_ADVICE_PRICE':
      return { ...state, calculatedAdvicePrice: action.payload };
    case 'SET_IS_SAVING_CONDITION':
      return { ...state, isSavingCondition: action.payload };
    case 'SET_COMPLETED_SCAN_DATA':
      return { ...state, completedScanData: action.payload };
    case 'SET_DUPLICATE_RECORDS':
      return { ...state, duplicateRecords: action.payload };
    case 'SET_SHOW_DUPLICATE_DIALOG':
      return { ...state, showDuplicateDialog: action.payload };
    case 'SET_PENDING_SAVE_DATA':
      return { ...state, pendingSaveData: action.payload };
    case 'RESET_SCAN':
      return initialScanState;
    default:
      return state;
  }
}