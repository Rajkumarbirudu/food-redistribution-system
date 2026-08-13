import React from "react";
import { useTranslation } from "../context/LanguageContext";

export default function StatCard({
  title,
  value,
  icon,
  description,
}) {
  const { t } = useTranslation();

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {t(title)}
          </p>

          <p className="mt-3 text-3xl font-bold">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs text-slate-400">
              {t(description)}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 p-3 text-sky-600 dark:text-sky-400">
          {icon}
        </div>
      </div>
    </article>
  );
}