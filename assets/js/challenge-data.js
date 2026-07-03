// Command challenges: user types a real git command, we validate it.
// Each: { task, accept:[RegExp...], answer, hint }
// Matching normalizes whitespace (trim + collapse internal spaces) but keeps case.
window.CHALLENGE_DATA = {
  'muc-3': [
    {
      task: 'Kích hoạt Git LFS cho tài khoản trên máy này (chạy một lần mỗi máy).',
      accept: [/^git lfs install$/],
      answer: 'git lfs install',
      hint: 'git lfs …',
    },
    {
      task: 'Kiểm tra phiên bản Git LFS đang cài.',
      accept: [/^git lfs version$/],
      answer: 'git lfs version',
      hint: 'git lfs …',
    },
    {
      task: 'Cấu hình pull = fetch + merge (khuyến nghị cho người mới) ở phạm vi global.',
      accept: [/^git config --global pull\.rebase false$/],
      answer: 'git config --global pull.rebase false',
      hint: 'git config --global pull.rebase …',
    },
  ],

  'muc-4': [
    {
      task: 'Clone dự án từ URL https://github.com/ten-studio/TenDuAn.git về máy.',
      accept: [/^git clone https:\/\/github\.com\/ten-studio\/TenDuAn\.git$/],
      answer: 'git clone https://github.com/ten-studio/TenDuAn.git',
      hint: 'git clone <url>',
    },
    {
      task: 'Kiểm chứng asset đã thực sự vào LFS (liệt kê file LFS).',
      accept: [/^git lfs ls-files$/],
      answer: 'git lfs ls-files',
      hint: 'git lfs ls-…',
    },
    {
      task: 'Chỉ commit hai file cấu hình .gitignore và .gitattributes vào vùng chờ (một lệnh add).',
      accept: [
        /^git add \.gitignore \.gitattributes$/,
        /^git add \.gitattributes \.gitignore$/,
      ],
      answer: 'git add .gitignore .gitattributes',
      hint: 'git add <file1> <file2>',
    },
  ],

  'muc-5': [
    {
      task: 'Gỡ thư mục Intermediate/ khỏi theo dõi của Git nhưng vẫn GIỮ file trên ổ đĩa.',
      accept: [/^git rm -r --cached Intermediate\/?$/],
      answer: 'git rm -r --cached Intermediate/',
      hint: 'git rm -r --cached <thư mục>',
    },
    {
      task: 'Xem các pattern đang được LFS theo dõi (đọc từ .gitattributes).',
      accept: [/^git lfs track$/],
      answer: 'git lfs track',
      hint: 'git lfs track',
    },
  ],

  'muc-6': [
    {
      task: 'Khóa asset Content/Maps/MainLevel.umap TRƯỚC khi mở ra sửa.',
      accept: [/^git lfs lock Content\/Maps\/MainLevel\.umap$/],
      answer: 'git lfs lock Content/Maps/MainLevel.umap',
      hint: 'git lfs lock <đường-dẫn>',
    },
    {
      task: 'Xem ai đang khóa file nào trong repo.',
      accept: [/^git lfs locks$/],
      answer: 'git lfs locks',
      hint: 'git lfs locks',
    },
    {
      task: 'Mở khóa asset Content/Maps/MainLevel.umap sau khi đã commit & push xong.',
      accept: [/^git lfs unlock Content\/Maps\/MainLevel\.umap$/],
      answer: 'git lfs unlock Content/Maps/MainLevel.umap',
      hint: 'git lfs unlock <đường-dẫn>',
    },
  ],

  'muc-7': [
    {
      task: 'Lấy code mới nhất từ nhánh main trên origin trước khi bắt đầu ngày làm việc.',
      accept: [/^git pull origin main$/],
      answer: 'git pull origin main',
      hint: 'git pull <remote> <nhánh>',
    },
    {
      task: 'Stage riêng file Source/Game/PlayerCharacter.cpp.',
      accept: [/^git add Source\/Game\/PlayerCharacter\.cpp$/],
      answer: 'git add Source/Game/PlayerCharacter.cpp',
      hint: 'git add <file>',
    },
    {
      task: 'Commit với message: Add double jump ability to PlayerCharacter (dùng cờ -m).',
      accept: [/^git commit -m ["']?Add double jump ability to PlayerCharacter["']?$/],
      answer: 'git commit -m "Add double jump ability to PlayerCharacter"',
      hint: 'git commit -m "…"',
    },
    {
      task: 'Đẩy nhánh feature/double-jump lên origin.',
      accept: [/^git push origin feature\/double-jump$/],
      answer: 'git push origin feature/double-jump',
      hint: 'git push <remote> <nhánh>',
    },
  ],

  'muc-8': [
    {
      task: 'Tạo và chuyển sang nhánh mới tên feature/enemy-ai (một lệnh).',
      accept: [
        /^git switch -c feature\/enemy-ai$/,
        /^git checkout -b feature\/enemy-ai$/,
      ],
      answer: 'git switch -c feature/enemy-ai',
      hint: 'git switch -c <nhánh>  (hoặc git checkout -b …)',
    },
    {
      task: 'Đang ở nhánh của mình, lấy thông tin mới rồi gộp origin/main vào nhánh hiện tại — bước GỘP.',
      accept: [/^git merge origin\/main$/],
      answer: 'git merge origin/main',
      hint: 'git merge <nguồn>',
    },
    {
      task: 'Xóa nhánh local feature/inventory-system (đã merge xong).',
      accept: [/^git branch -d feature\/inventory-system$/],
      answer: 'git branch -d feature/inventory-system',
      hint: 'git branch -d <nhánh>',
    },
    {
      task: 'Xóa nhánh feature/inventory-system trên remote origin.',
      accept: [/^git push origin --delete feature\/inventory-system$/],
      answer: 'git push origin --delete feature/inventory-system',
      hint: 'git push <remote> --delete <nhánh>',
    },
  ],

  'muc-9': [
    {
      task: 'Ép nhánh local về giống hệt origin/main (vứt hết thay đổi local).',
      accept: [/^git reset --hard origin\/main$/],
      answer: 'git reset --hard origin/main',
      hint: 'git reset --hard <remote>/<nhánh>',
    },
    {
      task: 'XEM TRƯỚC (không xóa thật) danh sách file chưa track sẽ bị dọn.',
      accept: [/^git clean -nd$/, /^git clean -dn$/],
      answer: 'git clean -nd',
      hint: 'git clean -nd  (n = xem trước)',
    },
    {
      task: 'Sau khi --amend nhánh riêng đã push, đẩy lại một cách AN TOÀN lên feature/my-branch.',
      accept: [/^git push --force-with-lease origin feature\/my-branch$/],
      answer: 'git push --force-with-lease origin feature/my-branch',
      hint: 'git push --force-with-lease <remote> <nhánh>',
    },
  ],

  'muc-10': [
    {
      task: 'Trong lúc merge xung đột asset, GIỮ phiên bản của nhánh HIỆN TẠI (của bạn) cho Content/Maps/MainLevel.umap.',
      accept: [/^git checkout --ours Content\/Maps\/MainLevel\.umap$/],
      answer: 'git checkout --ours Content/Maps/MainLevel.umap',
      hint: 'git checkout --ours <file>',
    },
    {
      task: 'Đang merge dở mà rối, HỦY để quay về trạng thái trước khi merge.',
      accept: [/^git merge --abort$/],
      answer: 'git merge --abort',
      hint: 'git merge --…',
    },
  ],

  'muc-11': [
    {
      task: 'Bỏ mọi thay đổi chưa commit của file PlayerCharacter.cpp (về như commit gần nhất).',
      accept: [/^git restore PlayerCharacter\.cpp$/],
      answer: 'git restore PlayerCharacter.cpp',
      hint: 'git restore <file>',
    },
    {
      task: 'Xem lịch sử di chuyển của HEAD để tìm và cứu commit tưởng đã mất.',
      accept: [/^git reflog$/],
      answer: 'git reflog',
      hint: 'git ref…',
    },
    {
      task: 'Cất tạm toàn bộ công việc đang dở để chuyển nhánh gấp.',
      accept: [/^git stash$/],
      answer: 'git stash',
      hint: 'git st…',
    },
    {
      task: 'Tạo một commit MỚI đảo ngược commit có hash a1b2c3d (an toàn cho nhánh chung).',
      accept: [/^git revert a1b2c3d$/],
      answer: 'git revert a1b2c3d',
      hint: 'git revert <hash>',
    },
  ],

  'muc-12': [
    {
      task: 'Tạo annotated tag v0.1.0-demo với message: Ban demo bai tap.',
      accept: [/^git tag -a v0\.1\.0-demo -m ["']?Ban demo bai tap["']?$/],
      answer: 'git tag -a v0.1.0-demo -m "Ban demo bai tap"',
      hint: 'git tag -a <tên> -m "…"',
    },
    {
      task: 'Đẩy riêng tag v0.1.0-demo lên origin.',
      accept: [/^git push origin v0\.1\.0-demo$/],
      answer: 'git push origin v0.1.0-demo',
      hint: 'git push <remote> <tag>',
    },
    {
      task: 'Tạo nhánh hotfix/demo-bug đứng đúng tại commit đã tag v0.1.0-demo.',
      accept: [
        /^git switch -c hotfix\/demo-bug v0\.1\.0-demo$/,
        /^git checkout -b hotfix\/demo-bug v0\.1\.0-demo$/,
      ],
      answer: 'git switch -c hotfix/demo-bug v0.1.0-demo',
      hint: 'git switch -c <nhánh> <tag>',
    },
  ],
};
