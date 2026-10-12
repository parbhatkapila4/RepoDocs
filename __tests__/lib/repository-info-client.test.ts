jest.mock("@/lib/actions", () => ({ getProjectRepositoryInfo: jest.fn() }));
jest.mock("@/lib/github", () => ({ getGitHubRepositoryInfo: jest.fn() }));

import * as fs from "fs";
import * as path from "path";
import { getProjectRepositoryInfo } from "@/lib/actions";
import { getGitHubRepositoryInfo } from "@/lib/github";
import { fetchProjectRepositoryInfo } from "@/lib/repository-info";

const serverAction = getProjectRepositoryInfo as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("fetchProjectRepositoryInfo (browser)", () => {
  it("asks the server for the metadata and never calls GitHub itself", async () => {
    serverAction.mockResolvedValue({ fullName: "acme/ledger", stars: 3 });

    await expect(fetchProjectRepositoryInfo("proj-1")).resolves.toEqual({
      fullName: "acme/ledger",
      stars: 3,
    });
    expect(serverAction).toHaveBeenCalledWith("proj-1");
    expect(getGitHubRepositoryInfo).not.toHaveBeenCalled();
  });

  it("returns null when the server call fails", async () => {
    serverAction.mockRejectedValue(new Error("network down"));

    await expect(fetchProjectRepositoryInfo("proj-1")).resolves.toBeNull();
  });

  it("has no code path that handles a GitHub token in the browser", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../src/lib/repository-info.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/githubToken|getProjectWithToken|@\/lib\/github/);
  });
});
