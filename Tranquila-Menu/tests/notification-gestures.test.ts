import { describe, expect, it } from "vitest";
import { notificationBottom, shouldDismissNotification } from "../src/lib/notificationGestures";

describe("notification gesture intent",()=>{
  it.each([[90,0],[-90,0],[0,50],[0,-50]])("dismisses deliberate drags in any direction (%s,%s)",(dx,dy)=>{
    expect(shouldDismissNotification({dx,dy,elapsed:500,width:350})).toBe(true);
  });
  it("ignores taps, shaky fingers and slow short drags",()=>{
    for(const [dx,dy,elapsed] of [[2,2,10],[15,5,20],[30,0,500],[0,25,500]])expect(shouldDismissNotification({dx:dx!,dy:dy!,elapsed:elapsed!,width:350})).toBe(false);
  });
  it("accepts short intentional flicks without mistaking a tap for a swipe",()=>{
    expect(shouldDismissNotification({dx:30,dy:3,elapsed:40,width:350})).toBe(true);
    expect(shouldDismissNotification({dx:8,dy:1,elapsed:2,width:350})).toBe(false);
  });
});
describe("notification clearance",()=>{
  it("leaves the bottom edge clear without an order bar",()=>expect(notificationBottom(800,[])).toBe(12));
  it("sits above the real order bar or taller sheet footer",()=>expect(notificationBottom(800,[720,680])).toBe(132));
  it("avoids the virtual keyboard",()=>expect(notificationBottom(800,[],300)).toBe(312));
});
