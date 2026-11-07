import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ITEMS } from "../src/lib/catalog";
import { APPROVED_GALLERIES, withApprovedPhotos } from "../src/lib/approvedPhotos";
import { PHOTOS } from "../src/lib/photos";
import { searchPhotoIndex } from "../src/lib/searchPhoto";
import { getMenu } from "../src/lib/cms";

afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe("Tranquila's approved photo set", () => {
  it("preserves every item, price, option and description", () => {
    const hash = createHash("sha256").update(JSON.stringify(ITEMS.map(({photos, ...item})=>item))).digest("hex");
    expect(hash).toBe("6313218e45939c2c6d4d83943619c68174a28bd69c07320417df8133c2260e3d");
  });
  it("assigns 30 matching assets across 14 galleries with local files", () => {
    const photos=Object.entries(PHOTOS).filter(([,p])=>p.src.startsWith("/images/approved/")||p.src.startsWith("/images/menu/"));
    expect(photos).toHaveLength(30);
    expect(Object.keys(APPROVED_GALLERIES)).toHaveLength(14);
    for(const [key,p] of photos) {
      expect(existsSync(join(process.cwd(),"public",p.src)),key).toBe(true);
      expect(ITEMS.filter(i=>i.photos?.includes(key)),key).toHaveLength(1);
    }
    for(const i of ITEMS)expect(i.photos?.length??0,i.id).toBeLessThanOrEqual(10);
    expect(ITEMS.find(i=>i.id==="veg-salad")!.photos).not.toContain("approved-mixed-salad-egg");
    expect(ITEMS.find(i=>i.id==="juice")!.photos).not.toContain("approved-orange-juice");
  });
  it("preserves staff galleries, covers and deliberate photo removal", () => {
    const item=ITEMS.find(i=>i.id==="rice")!;
    for(const custom of [{...item,photos:[]},{...item,photos:["/custom.webp"]},{...item,imageUrl:"https://example.com/custom.webp"},{...item,photos:[...item.photos!].reverse()}])expect(withApprovedPhotos(custom)).toBe(custom);
    expect(withApprovedPhotos(item)).toBe(item);
  });
  it("matches search options to their assigned gallery photos",()=>{
    for(const [id,optionId,key] of [["spaghetti","bolognese","spaghetti-bolognese"],["indomie","indomie-eggs","indomie-sausage-boiled-eggs"],["hot-drinks","hot-chocolate","approved-milo-hot"],["sides","fried-yam","fried-yam-pepper-sauce"]]){
      const item=ITEMS.find(i=>i.id===id)!;
      expect(item.photos![searchPhotoIndex(item,{groupId:"choice",optionId:optionId!})]).toBe(key);
    }
  });
  it.each(["tranquila","tranquila-nest"] as const)("upgrades CMS photos without writes or changes to branch data: %s",async branch=>{
    vi.stubEnv("SUPABASE_URL","https://test-only.invalid");vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","test-only");
    const saved={...ITEMS.find(i=>i.id==="rice")!,basePrice:17777,groups:[],photos:["jollof-rice","white-rice","fried-rice","special-rice","jambalaya-rice"],published:false,visible:false};
    const request=vi.fn(async(url:string,init?:RequestInit)=>{
      expect(init?.method??"GET").toBe("GET");expect(url).toContain(`branch_id=eq.${branch}`);
      return Response.json(url.includes("tranquila_branch_cms")?[{menu:{categories:[],items:[saved]},published_menu:{categories:[],items:[saved]},draft_initialized:true,published_initialized:true}]:[{item_id:"rice",available:false}]);
    });vi.stubGlobal("fetch",request);
    for(const published of [false,true]){
      const menu=await getMenu(published,branch);const actual=menu.items[0]!;
      expect(actual.photos).toEqual(APPROVED_GALLERIES.rice);
      expect({...actual,photos:undefined,available:undefined}).toEqual({...saved,photos:undefined,available:undefined});expect(actual.available).toBe(false);
    }
  });
});
