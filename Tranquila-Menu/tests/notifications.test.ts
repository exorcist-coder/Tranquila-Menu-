import { beforeEach, describe, expect, it, vi } from "vitest";
const api=vi.hoisted(()=>({success:vi.fn(),action:vi.fn(),error:vi.fn(),warning:vi.fn(),info:vi.fn(),dismiss:vi.fn()}));
vi.mock("sileo",()=>({sileo:api}));
beforeEach(()=>{vi.resetModules();vi.clearAllMocks();api.success.mockReturnValue("success-id");api.action.mockReturnValue("undo-id");});
describe("shared Sileo feedback",()=>{
  it("preserves Undo exactly once without dismissing a newer notification",async()=>{
    const {toast}=await import("../src/components/toastStore");
    const restore=vi.fn();toast.show("Order cancelled",{label:"Undo",run:restore});
    const options=api.action.mock.calls[0]![0];expect(options.button.title).toBe("Undo");
    toast.show("New feedback");options.button.onClick();options.button.onClick();
    expect(restore).toHaveBeenCalledTimes(1);
    toast.hide();expect(api.dismiss).toHaveBeenLastCalledWith("success-id");
  });
  it("uses error feedback for failures and preserves requested guest durations",async()=>{
    const {notify}=await import("../src/lib/notifications");const {toast}=await import("../src/components/toastStore");
    notify.error("The change was not saved.");expect(api.error).toHaveBeenCalledWith(expect.objectContaining({description:"The change was not saved.",duration:8500}));expect(api.success).not.toHaveBeenCalled();
    toast.show("Dish added",undefined,2200);expect(api.success).toHaveBeenCalledWith({title:"Dish added",duration:2200});
  });
});
