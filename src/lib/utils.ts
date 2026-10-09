export function countWords(str: string) {
    return (str.match(/[\u4e00-\u9fa5a-zA-Z0-9]/g) ?? []).length
  }
  
  export function formatWordCount(count: number) {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万字`
    return `${count}字`
  }