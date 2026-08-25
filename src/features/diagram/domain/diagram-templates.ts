import type { DiagramSource } from "./diagram-source";

export type DiagramTemplate = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly source: DiagramSource;
};

const flowchartSource: DiagramSource = {
  nodes: [
    { id: "start", label: "Start", type: "start" },
    { id: "process-order", label: "Process order", type: "process" },
    { id: "approved", label: "Approved?", type: "decision" },
    { id: "ship-order", label: "Ship order", type: "process" },
    { id: "notify-customer", label: "Notify customer", type: "process" },
    { id: "end", label: "End", type: "end" },
  ],
  edges: [
    { id: "start-process-order", from: "start", to: "process-order" },
    { id: "process-order-approved", from: "process-order", to: "approved" },
    { id: "approved-ship-order", from: "approved", to: "ship-order", label: "Yes" },
    { id: "approved-notify-customer", from: "approved", to: "notify-customer", label: "No" },
    { id: "ship-order-end", from: "ship-order", to: "end" },
    { id: "notify-customer-end", from: "notify-customer", to: "end" },
  ],
};

const authFlowSource: DiagramSource = {
  nodes: [
    { id: "start", label: "Start", type: "start" },
    { id: "submit-credentials", label: "Submit credentials", type: "process" },
    { id: "valid", label: "Valid?", type: "decision" },
    { id: "create-session", label: "Create session", type: "process" },
    { id: "show-error", label: "Show error", type: "process" },
    { id: "end", label: "End", type: "end" },
  ],
  edges: [
    { id: "start-submit-credentials", from: "start", to: "submit-credentials" },
    { id: "submit-credentials-valid", from: "submit-credentials", to: "valid" },
    { id: "valid-create-session", from: "valid", to: "create-session", label: "Valid" },
    { id: "valid-show-error", from: "valid", to: "show-error", label: "Invalid" },
    { id: "create-session-end", from: "create-session", to: "end" },
    { id: "show-error-end", from: "show-error", to: "end" },
  ],
};

const microservicesSource: DiagramSource = {
  nodes: [
    { id: "client", label: "Client", type: "start" },
    { id: "api-gateway", label: "API Gateway", type: "process" },
    { id: "orders-service", label: "Orders Service", type: "process" },
    { id: "users-service", label: "Users Service", type: "process" },
    { id: "datastore", label: "Datastore", type: "end" },
  ],
  edges: [
    { id: "client-api-gateway", from: "client", to: "api-gateway" },
    { id: "api-gateway-orders-service", from: "api-gateway", to: "orders-service" },
    { id: "api-gateway-users-service", from: "api-gateway", to: "users-service" },
    { id: "orders-service-datastore", from: "orders-service", to: "datastore" },
    { id: "users-service-datastore", from: "users-service", to: "datastore" },
  ],
};

const cicdPipelineSource: DiagramSource = {
  nodes: [
    { id: "commit", label: "Commit pushed", type: "start" },
    { id: "build", label: "Build", type: "process" },
    { id: "test", label: "Run tests", type: "process" },
    { id: "tests-passed", label: "Tests passed?", type: "decision" },
    { id: "deploy", label: "Deploy", type: "end" },
    { id: "fail", label: "Fail build", type: "end" },
  ],
  edges: [
    { id: "commit-build", from: "commit", to: "build" },
    { id: "build-test", from: "build", to: "test" },
    { id: "test-tests-passed", from: "test", to: "tests-passed" },
    { id: "tests-passed-deploy", from: "tests-passed", to: "deploy", label: "Yes" },
    { id: "tests-passed-fail", from: "tests-passed", to: "fail", label: "No" },
  ],
};

export const DIAGRAM_TEMPLATES: readonly DiagramTemplate[] = [
  {
    id: "flowchart",
    name: "Flowchart",
    description: "A simple decision flow from start to end with two branches.",
    source: flowchartSource,
  },
  {
    id: "auth-flow",
    name: "Auth flow",
    description: "Credential submission with a validity check and success/error paths.",
    source: authFlowSource,
  },
  {
    id: "microservices",
    name: "Microservices",
    description: "An API gateway fanning out to services backed by a shared datastore.",
    source: microservicesSource,
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD pipeline",
    description: "Commit, build, and test, then deploy or fail based on the test result.",
    source: cicdPipelineSource,
  },
];
