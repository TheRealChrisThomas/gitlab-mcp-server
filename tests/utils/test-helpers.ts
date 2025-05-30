import { readFileSync } from "fs";
import { join } from "path";

export const loadFixture = (fixturePath: string) => {
  const fullPath = join(__dirname, "..", "fixtures", fixturePath);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content);
};

type MockFunction = {
  (...args: any[]): any;
  mockResolvedValue: (value: any) => MockFunction;
  mockRejectedValue: (value: any) => MockFunction;
  mockReset: () => void;
};

export const createMockGitLabClient = () => {
  const mockGet = (() => {}) as any as MockFunction;
  const mockPost = (() => {}) as any as MockFunction;
  const mockPut = (() => {}) as any as MockFunction;

  return {
    gitlabGet: mockGet,
    gitlabPost: mockPost,
    gitlabPut: mockPut,
    mockGet,
    mockPost,
    mockPut,
    resetMocks: () => {
      // Will be implemented by Jest
    }
  };
};

export const createGitLabError = (statusCode: number, message: string) => {
  const error = new Error(message) as any;
  error.status = statusCode;
  error.response = {
    status: statusCode,
    data: { message }
  };
  return error;
};
