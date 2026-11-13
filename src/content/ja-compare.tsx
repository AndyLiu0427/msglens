import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "ja")}>{children}</Link>
);

/** Same rule as the English page: every claim is checked and dated; untested says so. */
export const jaCompare = {
  title: "無料オンライン msg ビューア比較【2026年】：メールをアップロードするのは？",
  description:
    "2026 年 9 月 30 日に無料の .msg ビューア 4 つを確認しました。メールをサーバーに送信するのはどれか、サイズ上限と対応形式、そしてどのビューアでも自分で確認できる方法を紹介します。",
  intro:
    "結論から言うと、4 つのうち 2 つは表示する前にファイルを自社のサーバーにアップロードします。残りの 2 つはブラウザの中でファイルを読み込み、何も送信しません。機密性のあるメールなら、ローカルで完結する 2 つのどちらかを使うか、1 分もかからない方法で自分で確認してください。",
  body: (
    <>
      <h2>比較表</h2>
      <p>
        <strong>2026 年 9 月 30 日</strong>に、各サイト自身のページとアップロード処理のコードを読んで確認しました。この表を作るために、どのサービスにもファイルをアップロードしていません。
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>ツール</th>
              <th>ファイルの送信先</th>
              <th>サイズ上限</th>
              <th>備考</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MsgLens（このサイト）</td>
              <td>ブラウザ内にとどまる</td>
              <td>100 MB</td>
              <td>.msg、.eml、winmail.dat に対応。添付ファイル対応。PDF と .eml へのエクスポート。オープンソース（MIT）。</td>
            </tr>
            <tr>
              <td>msg-viewer.pages.dev</td>
              <td>ブラウザ内にとどまる。コードにアップロード処理なし</td>
              <td>記載なし</td>
              <td>.msg に対応。コードに添付ファイルの処理を含む。オープンソース。</td>
            </tr>
            <tr>
              <td>Encryptomatic Viewer</td>
              <td>自社サーバーにアップロード（フォームによるアップロード）</td>
              <td>75 MB</td>
              <td>.msg、.eml、winmail.dat に対応。添付ファイル対応。</td>
            </tr>
            <tr>
              <td>CoolUtils MSG to PDF</td>
              <td>自社サーバーにアップロード。アップロードされたファイルは 24 時間以内に削除するとしている</td>
              <td>50 MB</td>
              <td>ビューアではなく変換ツール。PDF、DOC、HTML、JPG、TXT で出力。</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        ローカルで動く 2 つのツールは、どちらもサードパーティのスクリプトを読み込みます。msg-viewer.pages.dev は Google Analytics を、このサイトは Google AdSense を読み込みます。どちらもファイルは送信しません。本文が圧縮 RTF としてのみ保存されたメッセージをほかのツールが表示できるかは<strong>テストしていません</strong>。テストするには、メッセージをそれらのツールにアップロードする必要があったためです。
      </p>

      <h2>メールの場合に特に重要な理由</h2>
      <p>
        保存された .msg がメールマガジンであることはまれです。転送された内定通知、契約に関するやり取り、署名に顧客情報が入った苦情などです。読むためにアップロードすると、ヘッダーや添付ファイルを含む完全なコピーを、何もわからないサーバーに渡すことになります。削除の約束はきちんと守られるかもしれませんが、それはあくまで約束です。ファイルを一切送信しないビューアなら、約束は必要ありません。
      </p>

      <h2>どのビューアでも自分で確認する方法</h2>
      <ol>
        <li>
          ビューアを開き、ブラウザの開発者ツール（F12、Mac では Cmd+Option+I）を開いて <strong>Network</strong>（ネットワーク）タブを選びます。
        </li>
        <li>ビューアで .msg ファイルを開きます。</li>
        <li>
          ファイルと同じくらいのサイズのリクエスト（多くは <code>POST</code>）を探します。あればファイルはアップロードされています。スクリプトや広告を読み込む小さなリクエストしかなければ、ローカルで読み込まれています。
        </li>
        <li>
          より確実なテスト：ビューアを読み込んだ後でネットワークを切断し、ファイルを開きます。ローカルで動くビューアはそのまま使えますが、アップロードするビューアは使えません。
        </li>
      </ol>

      <h2>アップロードしても問題ない場合</h2>
      <p>
        公開されても構わないメッセージなら、どのツールを使っても問題ありません。CoolUtils のような変換ツールには、ビューアにはない出力形式もあります。選び方が重要になるのは内容が非公開の場合だけですが、保存されたメールはたいていそれに当たります。
      </p>

      <h2>関連記事</h2>
      <ul>
        <li>{L("/how-to-open-msg-files", "Outlook なしで .msg ファイルを開く方法")}</li>
        <li>{L("/outlook-msg-no-html-body", "Outlook のメッセージの多くに HTML 本文がない理由")}</li>
        <li>{L("/about", "MsgLens がブラウザでファイルを読む仕組みと、その確認方法")}</li>
      </ul>
    </>
  ),
};
