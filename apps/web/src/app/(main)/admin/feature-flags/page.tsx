import { Trash2 } from "lucide-react";

import { getFeatureFlags } from "~/server/data/cache/feature-flags";
import { deleteFeatureFlag } from "~/server/mutations/feature-flag";

import { cn } from "~/lib/utils";

import { FeatureFlagStatus } from "@hireup/common/constants";
import {
  Container,
  ContainerContent,
  ContainerHeader,
} from "~/components/layouts/container";
import { AuthRedirect } from "~/components/redirect";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { DeleteModal } from "~/components/ui/delete-modal";
import { FeatureBadge } from "~/components/ui/feature-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CreateFeatureFlag } from "~/features/feature-flags/create-feature-flag";
import { DeleteFeatureFlag } from "~/features/feature-flags/delete-feature-flag";
import { UpdateFeatureFlag } from "~/features/feature-flags/update-feature-flag";

const AdminFeatureFlagsPage = async () => {
  const flags = await getFeatureFlags();

  if (!flags) return <AuthRedirect redirect />;

  const existingFlags = Object.keys(flags);

  return (
    <Container className="px-2 py-2 md:px-0">
      <ContainerHeader>
        <h1 className="text-lg font-medium">Feature Flags</h1>
      </ContainerHeader>
      <ContainerContent className="md:pl-2">
        <Tabs defaultValue="existing" className="w-full">
          <TabsList>
            <TabsTrigger value="existing">Existing Flags</TabsTrigger>
            <TabsTrigger value="create">Create New Flag</TabsTrigger>
          </TabsList>
          <TabsContent value="existing" className="mt-2">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Existing Feature Flags
                </CardTitle>
                <CardDescription>
                  View and update the status of existing feature flags.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExistingFeatureFlags flags={flags} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="create">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Create New Flag</CardTitle>
                <CardDescription>
                  Create a new feature flag to enable or disable new features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateFeatureFlag existingFlags={existingFlags} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ContainerContent>
    </Container>
  );
};

const ExistingFeatureFlags = async ({
  flags,
}: {
  flags: Record<string, FeatureFlagStatus>;
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Update Status</TableHead>
            <TableHead>Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(flags).map(([flag, value]) => (
            <TableRow key={flag}>
              <TableCell>{flag}</TableCell>
              <TableCell className="min-w-40">
                {value === "enabled" || value === "disabled" ? (
                  <span
                    className={cn(
                      "font-medium",
                      value === "enabled" ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {value.at(0)?.toUpperCase() + value.slice(1)}
                  </span>
                ) : (
                  <FeatureBadge status={value} />
                )}
              </TableCell>
              <TableCell className="min-w-32">
                <UpdateFeatureFlag name={flag} status={value} />
              </TableCell>
              <TableCell>
                <DeleteFeatureFlag flag={flag} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminFeatureFlagsPage;
