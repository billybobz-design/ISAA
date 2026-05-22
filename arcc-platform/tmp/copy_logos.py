import shutil
import glob
import os

src_dir = r"C:\Users\吴子晋\.gemini\antigravity\brain\b2603984-af4a-4e03-9566-778eea066062"
dst_dir = r"C:\Users\吴子晋\.gemini\antigravity\brain\6add8b7f-2cc2-4439-97f8-944f1f90c48d"

for png in glob.glob(os.path.join(src_dir, "isaa_logo_*.png")):
    shutil.copy(png, dst_dir)
    print(f"Copied {png}")
