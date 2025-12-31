import useMediaQuery from "@/hooks/useMediaQuery";
import { View } from "@bassbook/react";

import type { ComponentProps, ReactNode } from "react";

interface PageProps extends ComponentProps<typeof View> {
  mobile?: ReactNode;
  desktop?: ReactNode;
  breakpoint?: number;
}

export const Page = ({ breakpoint = 480, ...props }: PageProps) => {
  const isMobile = useMediaQuery(`(max-width: ${breakpoint}px)`);
  const content = (isMobile ? props.mobile : props.desktop) ?? props.mobile ?? props.desktop;

  return (
    <View w="100%" h="100%" {...props}>
      {content}
    </View>
  );
};
