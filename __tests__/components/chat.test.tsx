import React from "react";
import type { ReactNode } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatPage from "../../src/app/(protected)/chat/page";
import { useProjectsContext } from "../../src/context/ProjectsContext";
import { useUser } from "../../src/hooks/useUser";
import { checkEmbeddingsStatus } from "../../src/lib/actions";

jest.mock("../../src/context/ProjectsContext", () => ({
  useProjectsContext: jest.fn(),
}));
jest.mock("../../src/hooks/useUser", () => ({
  useUser: jest.fn(),
}));
jest.mock("../../src/lib/actions", () => ({
  checkEmbeddingsStatus: jest.fn(),
}));
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  vscDarkPlus: {},
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

global.fetch = jest.fn();

const mockProjects = [
  {
    id: "1",
    name: "Test Project",
    repoUrl: "https://github.com/test/repo",
    userId: "user1",
    createdAt: new Date(),
  },
];

describe("ChatPage", () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: jest.fn(),
    });
  });

  beforeEach(() => {
    (useProjectsContext as jest.Mock).mockReturnValue({
      projects: mockProjects,
      selectedProjectId: "1",
    });
    (useUser as jest.Mock).mockReturnValue({
      user: { id: "user1", plan: "pro" },
      refreshUser: jest.fn(),
      loadUser: jest.fn(),
      isLoading: false,
      error: null,
    });
    (checkEmbeddingsStatus as jest.Mock).mockResolvedValue({
      hasEmbeddings: true,
      count: 1,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders chat interface correctly", () => {
    render(<ChatPage />);

    expect(screen.getByText("RepoDoc AI")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ask about your codebase...")
    ).toBeInTheDocument();
  });

  it("shows suggested questions when no messages", () => {
    render(<ChatPage />);

    expect(screen.getByText("Explain Code")).toBeInTheDocument();
    expect(screen.getByText("Refactor")).toBeInTheDocument();
    expect(screen.getByText("Deep Search")).toBeInTheDocument();
  });

  it("handles message submission correctly", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: "Test answer",
        sources: [],
      }),
    });

    render(<ChatPage />);

    const input = screen.getByPlaceholderText(
      "Ask about your codebase..."
    );
    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/query", expect.any(Object));
    });
  });

  it("shows loading state during API call", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ChatPage />);

    const input = screen.getByPlaceholderText(
      "Ask about your codebase..."
    );
    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Analyzing codebase...")).toBeInTheDocument();
    });
  });

  it("displays error message on API failure", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "API Error" }),
    });

    render(<ChatPage />);

    const input = screen.getByPlaceholderText(
      "Ask about your codebase..."
    );
    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(
        screen.getByText(" Sorry, I encountered an error processing your question. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("shows no project selected message when no project", () => {
    (useProjectsContext as jest.Mock).mockReturnValue({
      projects: [],
      selectedProjectId: null,
    });

    render(<ChatPage />);

    expect(screen.getByText("No Project Selected")).toBeInTheDocument();
  });

  it("clears chat when New Chat button is clicked", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ answer: "Test answer", sources: [] }),
    });

    render(<ChatPage />);

    const input = screen.getByPlaceholderText(
      "Ask about your codebase..."
    );
    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Test answer")).toBeInTheDocument();
    });

    const newChatButton = screen.getByText("New");
    fireEvent.click(newChatButton);

    expect(screen.queryByText("Test answer")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask about your codebase...")).toBeInTheDocument();
  });
});
