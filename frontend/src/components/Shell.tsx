import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  House,
  ListChecks,
  Plus,
  RefreshCw,
  ShoppingBasket,
  Users,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { pageMeta } from "../constants";
import type { Family, Member, PageKey } from "../types";
import { inputClass, primaryButtonClass } from "../ui";

const navigation = [
  { page: "dashboard" as const, label: "期限總覽", icon: CalendarClock },
  { page: "foods" as const, label: "食材清單", icon: ListChecks },
  { page: "spending" as const, label: "消費統計", icon: BarChart3 },
  { page: "add" as const, label: "新增食材", icon: Plus },
  { page: "family" as const, label: "家庭管理", icon: Users },
];

interface NavigationProps {
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
}

function Navigation({ activePage, onPageChange }: NavigationProps) {
  return (
    <nav className="grid gap-2" aria-label="主要選單">
      {navigation.map(({ page, label, icon: Icon }) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left font-medium transition-colors ${
            activePage === page
              ? "bg-[#8BA888] text-white shadow-sm"
              : "text-[#706B65] hover:bg-white hover:text-[#3D3834]"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

interface FamilySelectorsProps {
  families: Family[];
  members: Member[];
  familyCode: string;
  currentMember: string;
  setFamilyCode: Dispatch<SetStateAction<string>>;
  setCurrentMember: Dispatch<SetStateAction<string>>;
}

function FamilySelectors({
  families,
  members,
  familyCode,
  currentMember,
  setFamilyCode,
  setCurrentMember,
}: FamilySelectorsProps) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-[#3D3834]">
        家庭
        <select className={inputClass} value={familyCode} onChange={(event) => setFamilyCode(event.target.value)}>
          {families.map((family) => (
            <option key={family.family_code} value={family.family_code}>
              {family.family_name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[#3D3834]">
        目前操作者
        <select
          className={inputClass}
          value={currentMember}
          onChange={(event) => setCurrentMember(event.target.value)}
        >
          {members.map((member) => (
            <option key={member.member_name} value={member.member_name}>
              {member.member_name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

interface SidebarProps extends NavigationProps, FamilySelectorsProps {
  memberNames: string;
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#E8E4DE] bg-[#F9F7F2] px-5 py-7 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">🧊</span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-[#8BA888]">Fridge Tracker</p>
          <h1 className="text-xl font-bold text-[#3D3834]">食材期限管理</h1>
        </div>
      </div>

      <Navigation activePage={props.activePage} onPageChange={props.onPageChange} />

      <section className="mt-auto rounded-3xl border border-[#E8E4DE] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#706B65]">
          <House className="h-4 w-4 text-[#8BA888]" aria-hidden="true" />
          目前家庭
        </div>
        <FamilySelectors {...props} />
        <p className="mt-4 text-xs leading-5 text-[#706B65]">成員：{props.memberNames}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EEF3EB] px-3 py-1 text-xs font-semibold text-[#5D775A]">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          FastAPI 已連線
        </span>
      </section>
    </aside>
  );
}

interface HeaderProps extends NavigationProps {
  onAdd: () => void;
}

export function Header({ activePage, onPageChange, onAdd }: HeaderProps) {
  const meta = pageMeta[activePage];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E8E4DE] bg-[#FDFCF9]/80 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F9F7F2] text-xl lg:hidden">
              🧊
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-semibold text-[#8BA888]">
                <span aria-hidden="true">🌱</span> v11.2 Natural Warm Organic
              </p>
              <h2 className="flex items-center gap-2 truncate text-xl font-bold text-[#3D3834] sm:text-2xl">
                <span aria-hidden="true">{meta.emoji}</span>
                {meta.title}
              </h2>
            </div>
          </div>
          <button type="button" className={primaryButtonClass} onClick={onAdd}>
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">新增食材</span>
          </button>
        </div>
      </header>

      <div className="border-b border-[#E8E4DE] bg-white px-4 py-3 lg:hidden">
        <nav className="hide-scrollbar mx-auto flex max-w-[1600px] gap-2 overflow-x-auto" aria-label="手機版主要選單">
          {navigation.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-medium ${
                activePage === page ? "bg-[#8BA888] text-white" : "bg-[#F9F7F2] text-[#706B65]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

export function MobileFamilySwitcher(props: FamilySelectorsProps) {
  return (
    <section className="mb-6 rounded-3xl border border-[#E8E4DE] bg-white/80 p-5 shadow-sm lg:hidden">
      <div className="mb-4 flex items-center gap-2 font-semibold text-[#3D3834]">
        <House className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
        家庭與操作者
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FamilySelectors {...props} />
      </div>
    </section>
  );
}

interface ApiNoticeProps {
  isLoading: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function ApiNotice({ isLoading, errorMessage, onRetry }: ApiNoticeProps) {
  if (isLoading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#E8E4DE] bg-white px-4 py-3 text-sm text-[#706B65]">
        <RefreshCw className="h-4 w-4 animate-spin text-[#8BA888]" aria-hidden="true" />
        正在載入家庭冰箱資料...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D98E73]/40 bg-[#D98E73]/10 px-4 py-3 text-sm text-[#A95338]">
        <span className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          {errorMessage}
        </span>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 font-semibold">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#8BA888]/30 bg-[#8BA888]/10 px-4 py-3 text-sm font-medium text-[#5D775A]">
      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
      家庭冰箱已同步
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-28 items-center gap-4 rounded-3xl border border-dashed border-[#E8E4DE] bg-[#F9F7F2] p-6">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">✨</span>
      <div>
        <p className="font-semibold text-[#3D3834]">這一區整理得很乾淨</p>
        <p className="mt-1 text-sm text-[#706B65]">{text}</p>
      </div>
    </div>
  );
}
