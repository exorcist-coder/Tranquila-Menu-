"use client";
import type { Group } from "@/lib/catalog";

type OptionGroupsEditorProps = {
  groups: Group[];
  onChange: (groups: Group[]) => void;
};

function uniqueId(base: string, used: string[]) {
  let id = base;
  let suffix = 2;
  while (used.includes(id)) id = `${base}-${suffix++}`;
  return id;
}

export default function OptionGroupsEditor({ groups, onChange }: OptionGroupsEditorProps) {
  function updateGroup(index: number, update: Partial<Group>) {
    onChange(groups.map((group, i) => i === index ? { ...group, ...update } : group));
  }

  function addGroup() {
    const id = uniqueId("choices", groups.map(group => group.id));
    onChange([...groups, {
      id,
      label: "Choose an option",
      required: true,
      mode: "addon",
      options: [{ id: "option", label: "New option", price: 0 }],
    }]);
  }

  function addOption(groupIndex: number) {
    const group = groups[groupIndex];
    if (!group) return;
    const id = uniqueId("option", group.options.map(option => option.id));
    updateGroup(groupIndex, {
      options: [...group.options, { id, label: "New option", price: 0 }],
    });
  }

  function updateOption(groupIndex: number, optionIndex: number, update: { label?: string; price?: number }) {
    const group = groups[groupIndex];
    if (!group) return;
    updateGroup(groupIndex, {
      options: group.options.map((option, i) => i === optionIndex ? { ...option, ...update } : option),
    });
  }

  return <section className="admin-option-builder" aria-labelledby="admin-options-heading">
    <div className="admin-option-builder-head">
      <div>
        <span>FOOD CUSTOMISATION</span>
        <h3 id="admin-options-heading">Choices & add-ons</h3>
        <p>Let guests choose portions, sides, proteins, or extras for this dish.</p>
      </div>
      <button className="admin-secondary" type="button" onClick={addGroup}>+ Add choice group</button>
    </div>
    {groups.length === 0 ? <div className="admin-option-empty">
      <strong>No choices or add-ons yet</strong>
      <span>Add a group such as “Choose a side” or “Extra protein”.</span>
    </div> : <div className="admin-option-groups">{groups.map((group, groupIndex) => <fieldset className="admin-option-group" key={group.id}>
      <div className="admin-option-group-head">
        <label>Choice group name<input value={group.label} onChange={event => updateGroup(groupIndex, { label: event.target.value })} placeholder="e.g. Choose a side" /></label>
        <label>Guest selection<select value={group.required ? "required" : "optional"} onChange={event => updateGroup(groupIndex, { required: event.target.value === "required" })}>
          <option value="required">Required</option>
          <option value="optional">Optional</option>
        </select></label>
        <button className="admin-text-btn danger" type="button" onClick={() => onChange(groups.filter((_, i) => i !== groupIndex))}>Remove group</button>
      </div>
      <label className="admin-option-mode">Price behavior<select value={group.mode} onChange={event => updateGroup(groupIndex, { mode: event.target.value as Group["mode"] })}>
        <option value="addon">Add option price to dish price</option>
        <option value="absolute">Set dish price from this choice</option>
      </select></label>
      <div className="admin-option-list">
        <div className="admin-option-list-head"><span>Guest options</span><span>Additional / choice price</span><span></span></div>
        {group.options.map((option, optionIndex) => <div className="admin-option-row" key={option.id}>
          <label className="sr-only" htmlFor={`${group.id}-${option.id}-label`}>Option name</label>
          <input id={`${group.id}-${option.id}-label`} value={option.label} onChange={event => updateOption(groupIndex, optionIndex, { label: event.target.value })} placeholder="e.g. Fried plantain" />
          <label className="sr-only" htmlFor={`${group.id}-${option.id}-price`}>Option price in naira</label>
          <div className="admin-option-price"><span>₦</span><input id={`${group.id}-${option.id}-price`} type="number" min="0" step="50" value={option.price} onChange={event => updateOption(groupIndex, optionIndex, { price: Number(event.target.value) })} /></div>
          <button className="admin-text-btn danger" type="button" aria-label={`Remove ${option.label || "option"}`} disabled={group.options.length === 1} onClick={() => updateGroup(groupIndex, { options: group.options.filter((_, i) => i !== optionIndex) })}>Remove</button>
        </div>)}
      </div>
      <button className="admin-text-btn" type="button" onClick={() => addOption(groupIndex)}>+ Add option</button>
      <small className="admin-option-help">{group.mode === "absolute" ? "Use this for choices with different meal prices. Set the dish base price to ₦0." : "Option prices are added to the dish’s base price. Use ₦0 for included choices."}</small>
    </fieldset>)}</div>}
  </section>;
}