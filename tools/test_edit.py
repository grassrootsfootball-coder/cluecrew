import sys; sys.path.insert(0,'/Users/davidb/ClueCrew')
from tools.edit import sub, edit_file, AnchorError
from pathlib import Path
ok=[]
# 1. a match applies
ok.append(sub('abc','b','X')=='aXc')
# 2. NO match refuses, rather than returning the string unchanged
try: sub('abc','zzz','X'); ok.append(False)
except AnchorError: ok.append(True)
# 3. a non-unique anchor refuses too — it would have edited something else as well
try: sub('aba','a','X'); ok.append(False)
except AnchorError: ok.append(True)
# 4. required=False permits zero, but never the wrong number
ok.append(sub('abc','zzz','X',required=False)=='abc')
try: sub('aba','a','X',required=False); ok.append(False)
except AnchorError: ok.append(True)
# 5. all-or-nothing across a file: a later bad anchor leaves the file untouched
p=Path('/private/tmp/claude-501/-Users-davidb-ClueCrew/9a8d8aea-32f1-4537-bb18-2b54d4491646/scratchpad/e.txt')
p.parent.mkdir(parents=True,exist_ok=True); p.write_text('one two')
try: edit_file(p,[('one','1'),('nope','2')]); ok.append(False)
except AnchorError: ok.append(p.read_text()=='one two')
print('all pass' if all(ok) else f'FAIL {ok}')
