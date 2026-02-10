import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatPage from "@/app/(protected)/chat/page";
import { useProjectsContext } from "@/context/ProjectsContext";

jest.mock("@/context/ProjectsContext");
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
  beforeEach(() => {
    (useProjectsContext as jest.Mock).mockReturnValue({
      projects: mockProjects,
      selectedProjectId: "1",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders chat interface correctly", () => {
    render(<ChatPage />);

    expect(screen.getByText("Chat with Codebase")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ask a question about your codebase...")
    ).toBeInTheDocument();
  });

  it("shows suggested questions when no messages", () => {
    render(<ChatPage />);

    expect(screen.getByText("Start a Conversation")).toBeInTheDocument();
    expect(
      screen.getByText("How does authentication work in this project?")
    ).toBeInTheDocument();
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
      "Ask a question about your codebase..."
    );
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.click(sendButton);

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
      "Ask a question about your codebase..."
    );
    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(
        screen.getByText("Searching codebase and generating response...")
      ).toBeInTheDocument();
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
      "Ask a question about your codebase..."
    );
    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/encountered an error/i)).toBeInTheDocument();
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
      "Ask a question about your codebase..."
    );
    fireEvent.change(input, { target: { value: "Test question" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(
        screen.queryByText("Start a Conversation")
      ).not.toBeInTheDocument();
    });

    const newChatButton = screen.getByText("New Chat");
    fireEvent.click(newChatButton);

    await waitFor(() => {
      expect(screen.getByText("Start a Conversation")).toBeInTheDocument();
    });
  });
});
