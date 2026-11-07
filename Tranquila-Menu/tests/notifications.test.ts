import { beforeEach, describe, expect, it, vi } from "vitest";
const api=vi.hoisted(()=>({success:vi.fn(),action:vi.fn(),error:vi.fn(),warning:vi.fn(),info:vi.fn(),dismiss:vi.fn()}));
vi.mock("sileo",()=>({sileo:api}));
beforeEach(()=>{vi.resetModules();vi.clearAllMocks();vi.unstubAllGlobals();for(const name of ["success","action","error","warning","info"] as const)api[name].mockReturnValue("shared-sileo-slot");});
describe("Sileo interaction safety",()=>{
  it("runs the current Undo action once",async()=>{
    const {toast}=await import("../src/components/toastStore");const restore=vi.fn();toast.show("Order cancelled",{label:"Undo",run:restore});
    const options=api.action.mock.calls[0]![0];options.button.onClick();options.button.onClick();
    expect(restore).toHaveBeenCalledTimes(1);expect(api.dismiss).toHaveBeenCalledTimes(1);
  });
  it("does not let an obsolete Undo callback dismiss or alter newer feedback in the same Sileo slot",async()=>{
    const {toast}=await import("../src/components/toastStore");const restore=vi.fn();toast.show("Order cancelled",{label:"Undo",run:restore});
    const old=api.action.mock.calls[0]![0];toast.show("New feedback");old.button.onClick();
    expect(restore).not.toHaveBeenCalled();expect(api.dismiss).not.toHaveBeenCalled();
    toast.hide();expect(api.dismiss).toHaveBeenCalledOnce();
  });
  it("a swipe dismisses feedback without running Undo, and a stale swipe cannot dismiss its replacement",async()=>{
    const {toast}=await import("../src/components/toastStore");const control=await import("../src/lib/notificationController");const restore=vi.fn();
    toast.show("Order cancelled",{label:"Undo",run:restore});const token=control.notificationToken();toast.show("Next message");
    control.dismissNotification(token);expect(api.dismiss).not.toHaveBeenCalled();
    control.dismissNotification(control.notificationToken());expect(api.dismiss).toHaveBeenCalledOnce();expect(restore).not.toHaveBeenCalled();
  });
  it("keeps routine feedback compact and gives errors time to be read",async()=>{
    const {notify}=await import("../src/lib/notifications");const {toast}=await import("../src/components/toastStore");
    toast.show("Dish added");expect(api.success).toHaveBeenCalledWith(expect.objectContaining({title:"Dish added",duration:2000,autopilot:false,position:"top-right"}));
    notify.error("The change was not saved.");expect(api.error).toHaveBeenCalledWith(expect.objectContaining({description:"The change was not saved.",duration:8500,autopilot:{expand:180,collapse:7300}}));
  });
  it("places mobile feedback at the bottom",async()=>{
    vi.stubGlobal("window",{matchMedia:()=>({matches:true})});const {toast}=await import("../src/components/toastStore");toast.show("Dish added");
    expect(api.success).toHaveBeenCalledWith(expect.objectContaining({position:"bottom-center"}));vi.unstubAllGlobals();
  });
});
