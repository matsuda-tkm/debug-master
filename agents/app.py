import json
import os
import shutil
import subprocess
import time

import streamlit as st
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Configuration constants
MAX_ITERATIONS = 10
MAX_RETRIES = 3
GEMINI_MODEL_NAME = "gemini-2.0-flash"

SYSTEM_INSTRUCTION: str = """\
Write a Manim program to visually illustrate the following problem with animation:  
- The animation should convey the problem concisely with minimal text.  
- When a novice looks at this issue, they should be able to understand how the inputs are converted into outputs.
- The animations should not display any code.  
- **Do not use LaTeX in the text.**  
- Save the movie under default settings.
- Ensure the script includes `if __name__ == "__main__": main()`.
- Care should also be taken on the visual side to ensure that text in the video is not duplicated.
**Output should be Python code only, formatted as JSON with the key `code`.** Do not include any other text in the output.
"""
MODIFY_SYSTEM_INSTRUCTION: str = """\
Modify the code to fix the error in the animation.  
If the error relates to `latex`, do not use `latex` in the fix.
**Output should be Python code only, formatted as JSON with the key `code`.** Do not include any other text in the output.
"""


def call_gemini_api(prompt: str, system_prompt: str) -> str:
    """
    Gemini API にプロンプトを送信して、manimプログラムのコードを生成する関数
    JSONデコードエラーが発生した場合は再試行する
    """
    print("=" * 100)
    print(prompt)
    print("=" * 100)
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    # 最大再試行回数
    retry_count = 0

    while retry_count < MAX_RETRIES:
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    temperature=0.6,
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                ),
            )
            generated_code = response.text or ""
            # JSONデコードを試みる
            code_json = json.loads(generated_code)
            return code_json["code"]

        except json.JSONDecodeError:
            print(
                f"JSONデコードエラーが発生しました。再試行 {retry_count+1}/{MAX_RETRIES}"
            )
            # レスポンスがJSONでない場合、より明示的なプロンプトで再試行
            prompt = (
                prompt
                + '\n\nPlease respond with valid JSON having a \'code\' field only. Format: {"code": "your_code_here"}'
            )
            retry_count += 1
            # 少し待機して再試行
            time.sleep(1)

        except KeyError:
            print(f"'code'キーが見つかりません。再試行 {retry_count+1}/{MAX_RETRIES}")
            # 'code'キーがない場合
            prompt = (
                prompt
                + '\n\nYour response must include a \'code\' key in the JSON. Format: {"code": "your_code_here"}'
            )
            retry_count += 1
            time.sleep(1)

    # 全ての再試行が失敗した場合、元のレスポンスをそのまま返す
    print(
        "JSONデコードの再試行が全て失敗しました。レスポンステキストをそのまま返します。"
    )
    return response.text or ""


def clean_media_folder():
    """
    mediaフォルダが存在する場合に削除する関数
    """
    media_path = "media"
    if os.path.exists(media_path):
        try:
            shutil.rmtree(media_path)
            return True, "mediaフォルダを削除しました。"
        except Exception as e:
            return False, f"mediaフォルダの削除中にエラーが発生しました: {str(e)}"
    return False, "mediaフォルダは存在しませんでした。"


def run_manim_code(code: str) -> str:
    """
    生成されたmanimコードを一時ファイルに保存し、manimを実行します。
    生成された動画ファイルは output_dir 内に保存される想定です。
    実行結果（標準出力＋標準エラー）を返します。
    """
    # 実行前にmediaフォルダをクリーンアップ
    clean_media_folder()
    script_file = "generated_manim.py"
    with open(script_file, "w", encoding="utf-8") as f:
        f.write(code)
    cmd = ["python", script_file]
    process = subprocess.run(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    return process.stdout + " " + process.stderr


def find_video_file(base_dir="media/videos"):
    """
    動画ファイルを検索し、見つかったら最初のファイルのパスを返します。
    見つからない場合はNoneを返します。
    """
    if not os.path.exists(base_dir):
        return None
    # サブディレクトリを検索
    for subdir in os.listdir(base_dir):
        subdir_path = os.path.join(base_dir, subdir)
        if os.path.isdir(subdir_path):
            video_files = [
                os.path.join(subdir_path, file)
                for file in os.listdir(subdir_path)
                if file.endswith(".mp4")
            ]
            if video_files:
                return video_files[0]  # 最初に見つかった動画ファイルを返す
    return None


def check_video_exists(base_dir="media/videos"):
    """
    動画ファイルが base_dir/*/*.mp4 のパスに保存されているかをチェックします。
    拡張子が .mp4 のファイルが存在すれば成功と判定します。
    """
    return find_video_file(base_dir) is not None


def extract_error_info(log: str) -> str:
    """
    実行ログからエラー情報を抽出し、簡潔に整形します。
    完全なログではなく、重要なエラーメッセージのみを返します。
    """
    # エラーの行を抽出（Pythonの一般的なエラーパターン）
    error_lines = []
    lines = log.split("\n")
    error_started = False
    for line in lines:
        if "Error:" in line or "Exception:" in line or "Traceback" in line:
            error_started = True
        if error_started:
            error_lines.append(line)
            # エラースタックトレースの終わりを検出
            if (
                line.strip()
                and not line.startswith(" ")
                and 'File "' not in line
                and "Traceback" not in line
            ):
                return "\n".join(error_lines)
    # エラーパターンが見つからない場合は、ログの後半部分を返す
    if not error_lines and log:
        return "\n".join(lines[-10:])
    return "\n".join(error_lines)


def display_trial_result(result, show_video=True):
    """各試行結果をトグル形式で表示する関数

    Args:
        result: 試行結果の辞書
        show_video: 成功時に動画を表示するかどうか。メインのビデオ表示と重複しないようにするため
    """
    iteration = result["iteration"]
    success = result["success"]

    # 試行番号と成功/失敗の状態を表示
    status = "✅ 成功" if success else "❌ 失敗"
    with st.expander(f"試行 {iteration}: {status}", expanded=False):
        st.subheader("生成されたコード")
        st.code(result["code"], language="python")

        st.subheader("実行ログ")
        st.text(result["log"])

        if success:
            st.success("アニメーションが正常に生成されました。")
            # show_videoがTrueで、メインコンテナに表示されていない場合のみ表示
            if show_video:
                video_path = result.get("video_path")
                if video_path and os.path.exists(video_path):
                    st.subheader("生成されたアニメーション")
                    st.video(video_path)
                else:
                    st.warning("動画ファイルが見つかりませんでした。")


def main():
    # セッション状態で停止フラグを管理
    if "stop" not in st.session_state:
        st.session_state.stop = False

    # 試行結果を保存するためのセッション状態
    if "trial_results" not in st.session_state:
        st.session_state.trial_results = []
    # アニメーション生成の説明入力
    description = st.text_area(
        "生成したいアニメーションの説明を入力してください。", height=200
    )
    # 操作ボタン
    col1, col2 = st.columns(2)
    with col1:
        start_button = st.button("アニメーション生成開始")
    with col2:
        stop_button = st.button("停止")
        if stop_button:
            st.session_state.stop = True
    # 進捗表示用のプレースホルダーとプログレスバー
    progress_text = st.empty()
    progress_bar = st.progress(0)
    # コンテナを定義
    video_container = st.container()
    results_container = st.container()
    if start_button:
        if not description:
            st.error("説明を入力してください。")
        else:
            # 初期化：停止フラグを False に戻す
            st.session_state.stop = False

            # 前回の結果をクリア
            st.session_state.trial_results = []
            # 以前の失敗情報の履歴
            error_history = []
            code_history = []
            iteration = 0
            max_iterations = MAX_ITERATIONS  # 最大試行回数を設定
            while iteration < max_iterations:
                iteration += 1
                # プログレスバーを更新
                progress_percent = iteration / max_iterations
                progress_bar.progress(progress_percent)
                # ユーザーが停止ボタンを押した場合はループ終了
                if st.session_state.stop:
                    progress_text.text("処理がユーザーにより停止されました。")
                    progress_bar.progress(0)
                    break
                with st.spinner(
                    f"【試行 {iteration}/{max_iterations}】Gemini API にコード生成中..."
                ):
                    progress_text.text(
                        f"【試行 {iteration}/{max_iterations}】Gemini API にコード生成中..."
                    )
                if error_history:
                    # エラーに基づいて修正プロンプトを作成
                    prompt = code_history[-1] + "\n\n------\n\n" + error_history[-1]
                    generated_code = call_gemini_api(prompt, MODIFY_SYSTEM_INSTRUCTION)
                else:
                    # Gemini API を呼び出してコード生成
                    generated_code = call_gemini_api(description, SYSTEM_INSTRUCTION)
                with st.spinner(
                    f"【試行 {iteration}/{max_iterations}】生成されたコードを実行中..."
                ):
                    progress_text.text(
                        f"【試行 {iteration}/{max_iterations}】生成されたコードを実行中..."
                    )
                log = run_manim_code(generated_code)

                # 動画が正常に保存されたかチェック
                success = check_video_exists()

                # 成功した場合は動画ファイルのパスを取得
                video_path = None
                if success:
                    video_path = find_video_file()

                # 結果を保存
                new_result = {
                    "iteration": iteration,
                    "code": generated_code,
                    "log": log,
                    "success": success,
                    "video_path": video_path,
                }
                st.session_state.trial_results.append(new_result)

                # リアルタイムに結果を表示
                with results_container:
                    # 成功した場合はメインのビデオ表示と重複しないようにする
                    display_trial_result(new_result, show_video=not success)
                if success:
                    progress_text.text("動画が正常に保存されました。処理終了。")
                    # 完了時にプログレスバーを100%にする
                    progress_bar.progress(1.0)

                    # 成功した場合、ビデオセクションに動画を表示
                    with video_container:
                        st.header("生成されたアニメーション")
                        st.video(video_path)
                    break
                else:
                    # エラー情報を抽出して履歴に追加
                    error_info = extract_error_info(log)
                    error_history.append(error_info)
                    code_history.append(generated_code)
                    with st.spinner(
                        f"【試行 {iteration}/{max_iterations}】動画生成に失敗。エラーを分析して再試行します..."
                    ):
                        progress_text.text(
                            f"【試行 {iteration}/{max_iterations}】動画生成に失敗。エラーを分析して再試行します..."
                        )
                        time.sleep(1)
            # 最大試行回数に達した場合
            if iteration >= max_iterations and not check_video_exists():
                progress_text.text(
                    f"最大試行回数({max_iterations}回)に達しました。処理を終了します。"
                )
                # 完了時にプログレスバーを100%にする
                progress_bar.progress(1.0)


if __name__ == "__main__":
    main()
