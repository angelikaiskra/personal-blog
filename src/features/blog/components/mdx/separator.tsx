import { SparkleIcon } from '@/components/icons/sparkles-icon';

export function Separator() {
  return (
    <div role="separator" aria-orientation="horizontal" className="not-prose my-14 sm:my-16">
      <div className="flex w-full items-center gap-4" aria-hidden="true">
        <span className="bg-border h-0.5 flex-1" />
        <SparkleIcon className="text-primary size-10 shrink-0" />
        <span className="bg-border h-0.5 flex-1" />
      </div>
    </div>
  );
}
