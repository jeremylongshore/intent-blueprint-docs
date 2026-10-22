/** Explicit records prevent workbook instructions from becoming remote issues. */
export interface ExportTask {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
}

export function parseTaskRecords(markdown: string): ExportTask[] {
  const tasks: ExportTask[] = [];
  let current: ExportTask | undefined;
  let depth = 0;
  let acceptance = false;
  let fence: string | undefined;
  const ids = new Set<string>();

  for (const line of markdown.split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = undefined;
      continue;
    }
    if (fence) continue;
    const heading = line.match(/^(#{2,6})\s+(.+)$/);
    if (heading) {
      const record = heading[2].match(/^((?:TASK|STORY)-[A-Z0-9]+(?:[._-][A-Z0-9]+)*):\s+(.+)$/i);
      if (current && heading[1].length <= depth) current = undefined;
      if (record) {
        const id = record[1].toUpperCase();
        if (ids.has(id)) throw new Error(`Duplicate task record: ${id}`);
        if (/^(unknown|tbd|todo|placeholder)\b/i.test(record[2])) continue;
        ids.add(id);
        current = { id, title: record[2].trim(), description: '', priority: 'medium', acceptanceCriteria: [] };
        tasks.push(current);
        depth = heading[1].length;
        acceptance = false;
      } else if (current) {
        acceptance = /^acceptance criteria\b/i.test(heading[2]);
      }
      continue;
    }
    if (!current) continue;
    const priority = line.match(/^\s*(?:[-*]\s+)?(?:\*\*)?Priority(?:\*\*)?:\s*(critical|high|medium|low)\b/i);
    if (priority) current.priority = priority[1].toLowerCase() as ExportTask['priority'];
    const criterion = line.match(/^\s*[-*]\s+\[[ x]\]\s+(.+)/i);
    if (acceptance && criterion) current.acceptanceCriteria.push(criterion[1]);
    current.description += line + '\n';
  }
  return tasks.map(task => ({ ...task, description: task.description.trim() }));
}
