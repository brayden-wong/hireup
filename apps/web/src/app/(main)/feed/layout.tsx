import { PropsWithChildren } from "react";

import {
  Container,
  ContainerContent,
  ContainerHeader,
} from "../../../components/layouts/container";

const FeedLayout = ({ children }: PropsWithChildren) => {
  return (
    <Container>
      <ContainerHeader>
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-lg font-medium">Feed</h1>
        </div>
      </ContainerHeader>
      <ContainerContent>{children}</ContainerContent>
    </Container>
  );
};

export default FeedLayout;
