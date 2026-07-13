import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

import { IMPORT_PASSOS } from "@/components/dados/import/constants";

export function ImportHowItWorks() {
  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
      <div className="flex gap-3">
        <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 shrink-0 text-blue-700" />
        <div className="space-y-2 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Como funciona</p>
          <ol className="list-decimal space-y-1.5 pl-4">
            {IMPORT_PASSOS.map((passo) => (
              <li key={passo}>{passo}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
