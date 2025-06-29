// React Compatibility Fix for useLayoutEffect issues
import * as React from "react";

if (typeof window !== "undefined") {
  (window as any).React = React;
  if (!React.useLayoutEffect) {
    (React as any).useLayoutEffect = React.useEffect;
  }
}

export default React;
