# 引数のディレクトリの *.md を、本物のqiita-markdownでHTMLにして、*.qiita.html に書く。golden.shから走らせる
require "qiita/markdown"

processor = Qiita::Markdown::Processor.new(
  hostname: "qiita.com",
  base_url: "https://qiita.com/",
  # 埋め込みは別に扱う(#241)。Qiitaと同じく、ユーザーの入力として消毒する
  strict: true,
)
Dir.glob(File.join(ARGV.fetch(0), "*.md")).sort.each do |path|
  html = processor.call(File.read(path))[:output].to_s
  File.write(path.sub(/\.md\z/, ".qiita.html"), html)
end
