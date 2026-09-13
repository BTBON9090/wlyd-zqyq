/** 按当前范围只建立导航页面，业务内容留空。 */
export function BlankModule({ label }: { label: string }) {
  return (
    <section className="blank-module-page" aria-label={`${label}内容区域`}>
      <h1 className="sr-only">{label}</h1>
    </section>
  );
}
