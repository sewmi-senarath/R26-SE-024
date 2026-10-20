import { createContext, forwardRef, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, ScrollViewProps, TextInput, TextInputProps } from 'react-native';

type Ctx = { scrollToInput: (input: TextInput) => void } | null;
const ScrollCtx = createContext<Ctx>(null);

const MARGIN = 24; // breathing room kept between the field and the keyboard

/**
 * ScrollView that grows by the keyboard height and scrolls the focused
 * KeyboardAwareTextInput above the keyboard. Works on iOS and Android
 * (incl. edge-to-edge) without relying on KeyboardAvoidingView.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps & { children: ReactNode }>(
  function KeyboardAwareScrollView({ children, contentContainerStyle, onScroll, ...rest }, outerRef) {
    const innerRef = useRef<ScrollView | null>(null);
    const offsetY = useRef(0);
    const kbHeight = useRef(0);
    const [kbPad, setKbPad] = useState(0);

    useEffect(() => {
      const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const s = Keyboard.addListener(showEvt, (e) => {
        kbHeight.current = e.endCoordinates.height;
        setKbPad(e.endCoordinates.height);
      });
      const h = Keyboard.addListener(hideEvt, () => {
        kbHeight.current = 0;
        setKbPad(0);
      });
      return () => { s.remove(); h.remove(); };
    }, []);

    const scrollToInput = useCallback((input: TextInput) => {
      // wait for the keyboard animation / padding to settle, then measure
      setTimeout(() => {
        input.measureInWindow((_x, y, _w, h) => {
          const visibleBottom = Dimensions.get('window').height - kbHeight.current - MARGIN;
          const overlap = y + h - visibleBottom;
          if (overlap > 0) {
            innerRef.current?.scrollTo({ y: offsetY.current + overlap, animated: true });
          } else if (y < 80 && kbHeight.current > 0) {
            innerRef.current?.scrollTo({ y: Math.max(0, offsetY.current + y - 100), animated: true });
          }
        });
      }, Platform.OS === 'ios' ? 120 : 280);
    }, []);

    return (
      <ScrollCtx.Provider value={{ scrollToInput }}>
        <ScrollView
          ref={(r) => {
            innerRef.current = r;
            if (typeof outerRef === 'function') outerRef(r);
            else if (outerRef) outerRef.current = r;
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          scrollEventThrottle={16}
          onScroll={(e) => { offsetY.current = e.nativeEvent.contentOffset.y; onScroll?.(e); }}
          contentContainerStyle={[contentContainerStyle, { paddingBottom: kbPad }]}
          {...rest}
        >
          {children}
        </ScrollView>
      </ScrollCtx.Provider>
    );
  },
);

/** Drop-in TextInput: inside a KeyboardAwareScrollView it scrolls itself above the keyboard on focus. */
export const KeyboardAwareTextInput = forwardRef<TextInput, TextInputProps>(
  function KeyboardAwareTextInput({ onFocus, ...props }, outerRef) {
    const ctx = useContext(ScrollCtx);
    const innerRef = useRef<TextInput | null>(null);
    return (
      <TextInput
        {...props}
        ref={(r) => {
          innerRef.current = r;
          if (typeof outerRef === 'function') outerRef(r);
          else if (outerRef) outerRef.current = r;
        }}
        onFocus={(e) => {
          onFocus?.(e);
          if (ctx && innerRef.current) ctx.scrollToInput(innerRef.current);
        }}
      />
    );
  },
);
