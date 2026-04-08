import * as React from "react";

import { type ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

type ActionType = typeof actionTypes;

type Action = typeof actionTypes[keyof typeof actionTypes] extends
  infer K extends keyof ActionType
  ? { type: K; toast?: Partial<ToasterToast> } & Partial<ToasterToast>
  : never;

interface State {
  toasts: ToasterToast[];
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast?.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST:
      const { toastId } = action;

      // ! Side effects ! - This means you would not be able to call this method with the same id for the duration of the timeout.
      // TODO: Revisit if this should be a side effect or not.
      if (toastId) {
        // biome-ignore lint/nursery/noNonNullAssertion: <explanation>
        addToastRef(toastId, { dismiss: true });
      } else {
        state.toasts.forEach((toast) =>
          // biome-ignore lint/nursery/noNonNullAssertion: <explanation>
          addToastRef(toast.id, { dismiss: true })
        );
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: ((state: State) => void)[] = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

type Toast = Partial<ToasterToast>;

type ToastRef = { dismiss?: boolean };
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const toastRefs = new Map<string, ToastRef>();

function addToastRef(toastId: string, ref: ToastRef) {
  toastRefs.set(toastId, { ...toastRefs.get(toastId), ...ref });
}

function shouldDismiss(toastId: string) {
  const ref = toastRefs.get(toastId);
  if (ref) {
    return ref.dismiss;
  }
  return false;
}

function dismissToast(toastId?: string) {
  dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast: React.useCallback((props: Toast) => {
      const id = crypto.randomUUID();

      const dismiss = () => dismissToast(id);

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) {
              dismissToast(id);
            }
          },
        },
      });

      if (props.duration) {
        const timeout = setTimeout(() => dismissToast(id), props.duration);
        toastTimeouts.set(id, timeout);
      } else if (props.duration === undefined || props.duration === null) {
        const timeout = setTimeout(
          () => {
            if (shouldDismiss(id)) {
              dismissToast(id);
            }
          },
          TOAST_REMOVE_DELAY,
        );
        toastTimeouts.set(id, timeout);
      }

      return { id, dismiss };
    }, []),
    dismiss: React.useCallback((toastId?: string) => dismissToast(toastId), []),
  };
}

export { useToast, dismissToast };
