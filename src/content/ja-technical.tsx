import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "ja")}>{children}</Link>
);

/**
 * Japanese first-hand technical writing.
 * Translated from en-technical.tsx; keep keys, figures and spec names in sync with it.
 */
export const jaTechnical = {
  rtfBody: {
    title: ".msg に HTML 本文がない理由：圧縮 RTF と MS-OXRTFCP",
    description:
      "実際の業務用 .msg ファイル 20 件を調べたところ、17 件は本文を圧縮 RTF だけで保存していました。その意味、Outlook がそうする理由、PidTagHtml だけを読む単純な実装が壊れる箇所を解説します。",
    intro:
      ".msg ファイルを開いて HTML を探しても、たいていは見つかりません。Outlook は本文を最大 3 か所に保存しますが、誰もが最初に探す場所はたいてい空です。これが、.msg ビューアが空白のページを表示してしまう最大の理由です。",
    body: (
      <>
        <h2>測定結果</h2>
        <p>
          実際の業務用 <code>.msg</code> ファイル 20 件（オファー、請求書、見積書、転送されたスレッドなど、仕事で使うメールボックスのごく普通の中身）を調べたところ、<strong>17 件には HTML 本文がまったくありませんでした</strong>。書式付きのメッセージは、圧縮 RTF としてしか存在していませんでした。
        </p>
        <p>
          つまり 85% です。<code>PidTagHtml</code> を読み、何も見つからずにあきらめるビューアは、5 件中 4 件以上で空のページを表示します。これは例外的なケースではなく、普通のケースです。多くの <code>.msg</code> ツールが、テスト用のメッセージでは完璧に動くのに実際のメールでは壊れて見えるのは、このためです。
        </p>
        <p>
          この数字をあえて正確に示すのは、ほとんど誰も示していないからです。多くのドキュメントは 3 つの本文プロパティを選択肢として並べるだけで、実際にどれに出会うのかは書いていません。
        </p>

        <h2>本文が保存される 3 つの場所</h2>
        <p>
          <code>.msg</code> ファイルは Compound File Binary コンテナです。Office が <code>.doc</code> や <code>.xls</code> に使っていたのと同じ OLE2 構造で、MAPI プロパティを個別の内部ストリームとして保持しています。本文はそのうち 3 つに入っている可能性があります。
        </p>
        <ul>
          <li>
            <strong><code>PidTagHtml</code></strong> (0x1013)：生のバイト列としての HTML 本文。誰もが読むのはこれですが、存在しないことがよくあります。
          </li>
          <li>
            <strong><code>PidTagRtfCompressed</code></strong> (0x1009)：圧縮された RTF としての本文。少しでも書式のあるメッセージには、ほぼ必ず存在します。
          </li>
          <li>
            <strong><code>PidTagBody</code></strong> (0x1000)：プレーンテキスト。ほぼ常に存在しますが、ほぼ常に不十分な代用品です。表は崩れ、強調は消え、引用された返信の連なりは区別のつかない文字の壁になります。
          </li>
        </ul>
        <p>
          正しいフォールバックの順序は、HTML、次に RTF を HTML に戻したもの（de-encapsulation）、最後にプレーンテキストです。真ん中の手順を飛ばすと、再現性の 85% を失います。
        </p>

        <h2>「圧縮 RTF」が実際に意味するもの</h2>
        <p>
          この圧縮は gzip でも deflate でもありません。<strong>MS-OXRTFCP</strong> で定められた Microsoft 独自の LZ77 の変種です。最も変わった特徴は、事前に読み込まれた辞書から始まることです。この辞書は、<code>{"\\viewkind"}</code>、<code>{"\\par"}</code>、<code>{"\\pard"}</code> のようなよく使われる RTF 制御語を並べた 207 バイトの文字列です。
        </p>
        <p>
          メッセージの最初のバイトを読む前から、これらのトークンがすでにウィンドウに入っています。そのため、短い RTF 文書は汎用のアルゴリズムよりはるかによく圧縮されます。同時に、標準的なツールではこのストリームを展開できないことも意味します。この辞書がそのままないと、ストリーム冒頭の後方参照は何も指さないからです。
        </p>
        <p>
          ストリームは非圧縮で保存されることもあり、その場合はヘッダーのマジック値が <code>LZFu</code> ではなく <code>MELA</code> になります。常に圧縮されていると決めつけている実装は、これで失敗します。
        </p>

        <h2>意外な点：RTF の中に HTML が入っている</h2>
        <p>
          Outlook が HTML メッセージを送るとき、HTML を捨てて RTF として作り直すわけではありません。HTML を<em>包み込む</em>のです。RTF ストリームは元の HTML を内部に持っていて、RTF リーダーと HTML リーダーがそれぞれ必要なものを読めるようにマークアップされています。この仕組みが <strong>MS-OXRTFEX</strong> で、次の 3 つの仕掛けで動いています。
        </p>
        <ul>
          <li>
            ヘッダー内の <code>{"\\fromhtml1"}</code>。この RTF がネイティブの RTF ではなく、HTML をカプセル化したものであることを宣言します。
          </li>
          <li>
            <code>{"{\\*\\htmltag<N> ... }"}</code> destination。それぞれが元の HTML ソースの断片をそのまま保持しています。番号は、その断片の種類を表します。
          </li>
          <li>
            <code>{"\\htmlrtf"}</code> / <code>{"\\htmlrtf0"}</code> のトグル。RTF リーダーにまともな表示をさせるためだけに存在する RTF を囲みます。HTML を取り出す処理（de-encapsulator）は、その間のものをすべて無視しなければなりません。
          </li>
        </ul>
        <p>
          HTML を組み立て直すには、RTF をたどりながら <code>htmltag</code> destination の中身を出力し、トグルに従い、文字のエスケープをデコードします。<code>{"\\'hh"}</code> は宣言されたコードページの 1 バイト、<code>{"\\uN"}</code> は Unicode のコードポイントで、その後に読み飛ばすべき <code>N</code> 個の代替文字が続きます。この読み飛ばす数を間違えると、ラテン文字以外のメッセージはすべて余計な文字だらけになります。
        </p>

        <h2>知っておくべき落とし穴</h2>
        <p>
          HTML の de-encapsulation では、単独の <code>{"\\par"}</code> は RTF 側のレイアウトです。本当の段落構造は <code>htmltag</code> destination が運ぶ <code>&lt;p&gt;</code> タグにすでに含まれているので、<code>{"\\par"}</code> に対して改行を出力すると重複します。正しい動作は、これを捨てることです。
        </p>
        <p>
          ただし、<code>{"\\*\\htmltag"}</code> destination の中では意味が逆になります。そこでは、元の HTML ソースにあった改行を表しています。Outlook はこれを <code>{"{\\*\\htmltag4 \\par }"}</code> と書きます。HTML はその改行をスペース 1 つにまとめます。これを捨てると、隣り合う単語がくっついてしまいます。
        </p>
        <p>
          一度見れば、症状は見間違えようがありません。ソースでは <em>prevailing</em> と <em>9%</em> の間に改行があったのに、<em>「the prevailing9% GST」</em>という文になってしまいます。同じ制御語に 2 つのルールがあり、どちらになるかは文脈で決まるのです。
        </p>

        <h2>再現性の問題のもう半分</h2>
        <p>
          HTML を取り戻しても、それで終わりではありません。Outlook は書式を、各要素のインラインの <code>style</code> 属性ではなく、<code>&lt;head&gt;</code> 内の <code>&lt;style&gt;</code> ブロックに書き込みます。
        </p>
        <p>
          メッセージをサニタイズして <code>&lt;body&gt;</code> の断片だけを残すビューアは、このスタイルシートを黙って捨ててしまいます。これは DOMPurify を含む、ほとんどの HTML サニタイザーの既定の動作です。テキストは残りますが、表の罫線、フォント、色、余白は残りません。実際のメッセージでは、書式の整った見積表になるか、書式のない数字の羅列になるかの違いです。
        </p>
        <p>
          これは静かな失敗です。エラーは出ず、テキストも欠けておらず、Outlook と並べて比べるまではそれらしく見えます。
        </p>

        <h2>自分のファイルで確かめる方法</h2>
        <p>
          <code>.msg</code> は複合ファイルなので、OLE2 ブラウザならどれでもストリームの一覧を表示できます。本文のプロパティは <code>__substg1.0_1013</code>（HTML）、<code>__substg1.0_1009</code>（圧縮 RTF）、<code>__substg1.0_1000</code>（プレーンテキスト）として表示され、末尾にデータ型を示す接尾辞が付きます。
        </p>
        <p>
          <code>1013</code> がなく <code>1009</code> がある場合、そのファイルは 85% の側です。そのメッセージを正しく表示できるツールは、上で説明した RTF の処理を行っています。
        </p>

        <h2>ビューアを選ぶときの意味</h2>
        <p>
          実際のメールで使えるツールと、テスト用のメッセージでしか使えないツールは、2 つの質問で見分けられます。
        </p>
        <ul>
          <li>
            <strong>圧縮 RTF を de-encapsulate できるか？</strong>書式があるとわかっているメッセージを開いてください。本文が空か書式なしなら、できません。
          </li>
          <li>
            <strong>メッセージ自身のスタイルシートを保つか？</strong>表を含むメッセージを開いてください。罫線が消えていれば、<code>&lt;head&gt;&lt;style&gt;</code> を捨てています。
          </li>
        </ul>
        <p>
          どちらも、手元にあるファイルで約 30 秒あれば確かめられます。{L("/", "このサイトのビューア")}は両方に対応しています。それこそが、このビューアを作った理由です。コンテナ形式の詳細は{L("/what-is-a-msg-file", ".msg ファイルとは")}で、本文とは関係のない不具合は{L("/msg-file-wont-open", "トラブルシューティングガイド")}で解説しています。
        </p>
      </>
    ),
  },
} as const;
