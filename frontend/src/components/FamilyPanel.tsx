import { Crown, UserRound } from "lucide-react";
import { memberEmoji } from "../constants";
import type { Family, Member } from "../types";

interface FamilyPanelProps {
  family: Family | null;
  members: Member[];
  currentMember: string;
}

export function FamilyPanel({ family, members, currentMember }: FamilyPanelProps) {
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-[#E8E4DE] bg-[#F9F7F2] p-6 lg:p-8">
        <p className="text-xs font-semibold uppercase text-[#8BA888]">家庭管理</p>
        <h3 className="mt-2 text-2xl font-bold text-[#3D3834]">{family?.family_name || "示範家庭"}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#706B65]">
          目前操作者為「{currentMember}」，新增食材與標記使用都會以這個成員留下紀錄。
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <article
            key={member.member_name}
            className="rounded-3xl border border-[#E8E4DE] bg-white/80 p-6 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EEF3EB] text-2xl" aria-hidden="true">
                {memberEmoji(member.member_name, member.role)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F9F7F2] px-3 py-1.5 text-xs font-semibold text-[#706B65]">
                {member.role === "admin" ? <Crown className="h-3.5 w-3.5 text-[#C9A55C]" /> : <UserRound className="h-3.5 w-3.5" />}
                {member.role === "admin" ? "管理員" : "成員"}
              </span>
            </div>
            <h4 className="mt-5 text-lg font-bold text-[#3D3834]">{member.member_name}</h4>
            <p className="mt-2 text-sm text-[#706B65]">已加入家庭冰箱</p>
          </article>
        ))}
      </section>
    </div>
  );
}
