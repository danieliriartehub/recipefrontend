import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge basic tailwind classes", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
  });

  it("should resolve conflicting tailwind classes", () => {
    // twMerge will keep the last conflicting class (px-4 overrides px-2)
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should handle conditional classes using clsx", () => {
    const isActive = true;
    const isDisabled = false;

    expect(
      cn(
        "base-class",
        isActive && "active-class",
        isDisabled && "disabled-class"
      )
    ).toBe("base-class active-class");
  });

  it("should handle arrays and objects", () => {
    expect(
      cn(
        ["class-1", "class-2"],
        { "class-3": true, "class-4": false }
      )
    ).toBe("class-1 class-2 class-3");
  });

  it("should handle undefined, null, and empty inputs gracefully", () => {
    expect(cn("class-1", undefined, null, "", "class-2")).toBe("class-1 class-2");
  });
});
