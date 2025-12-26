import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "@/App";
import Mobile from "./mobile";
import { Page } from "@/components/Page";

const Home = () => {
  return <Page bgColor="bgWeak" mobile={<Mobile />} />;
};

export default () =>
  createRoute({
    path: "/home",
    component: Home,
    getParentRoute: () => rootRoute,
  });
