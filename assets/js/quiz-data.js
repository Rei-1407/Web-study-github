// Interactive concept quizzes, keyed by lesson id.
// Each question: { q, options[], answer(index), explain }
window.QUIZ_DATA = {
  'muc-1': [
    {
      q: 'Đâu là mô tả đúng về mối quan hệ giữa Git và GitHub?',
      options: [
        'Git và GitHub là hai tên gọi của cùng một phần mềm',
        'Git là phần mềm quản lý phiên bản chạy trên máy bạn; GitHub là nơi host repo trên đám mây và thêm công cụ cộng tác',
        'GitHub chạy trên máy bạn, Git là dịch vụ đám mây',
        'Git chỉ dùng cho code, GitHub chỉ dùng cho asset',
      ],
      answer: 1,
      explain: 'Git là công cụ quản lý phiên bản cục bộ; GitHub host repo Git trên cloud và bổ sung Pull Request, review, issue, CI.',
    },
    {
      q: 'Điều gì khiến việc dùng Git cho dự án Unreal Engine KHÁC HẲN dự án phần mềm thông thường?',
      options: [
        'UE không hỗ trợ Git',
        'Dự án UE quá nhỏ nên không cần nhánh',
        'Phần lớn nội dung là asset nhị phân (.uasset, .umap) mà Git không merge được',
        'Git chạy chậm trên Windows',
      ],
      answer: 2,
      explain: 'Asset nhị phân không merge được → phải đi qua Git LFS và nên khóa (lock) khi sửa. Đây là sợi chỉ đỏ của toàn tài liệu.',
    },
  ],

  'muc-2': [
    {
      q: 'Bạn vừa chỉnh một Blueprint trong Content Browser và bấm Save (chưa chạy git add). File đó đang ở khu vực nào của Git?',
      options: ['Staging Area', 'Local Repo', 'Working Directory', 'Remote'],
      answer: 2,
      explain: 'Mọi thay đổi chưa git add đều nằm ở Working Directory.',
    },
    {
      q: 'Bạn đã chạy git add rồi git commit. Đồng đội đã thấy được thay đổi chưa?',
      options: [
        'Rồi, commit tự đồng bộ lên GitHub',
        'Chưa — commit mới chỉ nằm ở Local Repo, phải git push thì remote mới có',
        'Rồi, vì git add đã đẩy lên remote',
        'Chưa, phải chờ đồng đội chạy git fetch tự động',
      ],
      answer: 1,
      explain: 'Commit chỉ ghi vào Local Repo trên máy bạn. Phải git push thì GitHub mới có và đồng đội mới kéo về được.',
    },
    {
      q: 'Lệnh nào tải thông tin mới nhất từ GitHub về mà KHÔNG làm thay đổi bất kỳ file nào trên máy bạn?',
      options: ['git pull origin main', 'git merge origin/main', 'git fetch origin', 'git push origin main'],
      answer: 2,
      explain: 'git fetch an toàn tuyệt đối — chỉ tải thông tin về để "nhìn trước", không đụng vào file working directory.',
    },
    {
      q: 'git pull thực chất là cách viết gọn của hai lệnh nào?',
      options: ['git add + git commit', 'git fetch + git merge', 'git clone + git checkout', 'git status + git diff'],
      answer: 1,
      explain: 'git pull origin main = git fetch + git merge origin/main.',
    },
  ],

  'muc-3': [
    {
      q: 'Vì sao lệnh git lfs install BẮT BUỘC phải chạy TRƯỚC khi clone một repo UE?',
      options: [
        'Để repo tải nhanh hơn',
        'Nếu chưa có LFS, asset tải về chỉ là file con trỏ vài dòng text chứ không phải nội dung thật',
        'Để Git tự tạo nhánh main',
        'Để cấu hình user.name và user.email',
      ],
      answer: 1,
      explain: 'Không có LFS thì asset về chỉ là pointer. Luôn git lfs install trước khi clone/commit asset UE.',
    },
    {
      q: 'GitHub không cho dùng mật khẩu tài khoản cho thao tác Git qua HTTPS. Fine-grained token cần cấp quyền gì để push code?',
      options: ['Actions: Read', 'Contents: Read and write', 'Metadata: Read', 'Administration: Write'],
      answer: 1,
      explain: 'Cấp quyền Contents: Read and write cho token, giới hạn ở đúng repo cần truy cập.',
    },
    {
      q: 'Chạy ssh -T git@github.com và nhận thông báo GitHub chào bằng username của bạn kèm câu "không cấp shell access". Đây là?',
      options: [
        'Lỗi cấu hình SSH, cần tạo lại khóa',
        'Thành công — GitHub chỉ chặn shell chứ không chặn Git',
        'Token đã hết hạn',
        'Máy bạn bị chặn firewall',
      ],
      answer: 1,
      explain: 'Đó là dấu hiệu THÀNH CÔNG. GitHub chỉ chặn shell access, không chặn thao tác Git.',
    },
  ],

  'muc-4': [
    {
      q: 'Khi khởi tạo repo mới cho dự án UE, thứ tự nào là ĐÚNG?',
      options: [
        'Copy dự án UE vào rồi commit tất cả, sau đó mới thêm .gitattributes',
        'Commit .gitignore và .gitattributes TRƯỚC, rồi mới copy dự án UE và commit',
        'Push asset lên trước, cấu hình LFS sau',
        'Thứ tự không quan trọng',
      ],
      answer: 1,
      explain: 'Commit hai file cấu hình trước để LFS bắt asset ngay từ commit đầu. Sai thứ tự khiến lịch sử phình to vĩnh viễn.',
    },
    {
      q: 'Sau khi push dự án lên, git lfs ls-files hiển thị danh sách RỖNG. Điều này nghĩa là gì?',
      options: [
        'Mọi thứ đều ổn',
        'Asset KHÔNG vào LFS — cần dừng lại và sửa .gitattributes trước khi đi tiếp',
        'Repo chưa có commit nào',
        'LFS chưa được cài trên GitHub',
      ],
      answer: 1,
      explain: 'Danh sách rỗng = asset đi vào Git thường thay vì LFS. Phải sửa .gitattributes ngay.',
    },
    {
      q: 'Thư mục nào SAU đây KHÔNG nên commit vào repo UE?',
      options: ['Content/', 'Config/', 'Source/', 'Intermediate/'],
      answer: 3,
      explain: 'Binaries/, Intermediate/, DerivedDataCache/, Saved/ đều sinh ra khi build — tái tạo được, không commit.',
    },
  ],

  'muc-5': [
    {
      q: 'Trong .gitattributes cho UE, tại sao .uasset và .umap được đánh dấu "lockable"?',
      options: [
        'Để nén file cho nhẹ',
        'Vì là asset nhị phân không merge được — cho phép khóa để tránh hai người sửa cùng lúc',
        'Để Git tự merge chúng',
        'Để loại chúng khỏi LFS',
      ],
      answer: 1,
      explain: 'lockable cho phép git lfs lock; file lockable còn ở chế độ read-only cho tới khi bạn lock — nhắc bạn khóa trước khi sửa.',
    },
    {
      q: 'Bạn lỡ commit nhầm thư mục Intermediate/. Thêm nó vào .gitignore rồi — nhưng file cũ vẫn bị theo dõi. Cách gỡ đúng?',
      options: [
        'git rm -r --cached Intermediate/ rồi commit',
        'Xóa thủ công trên GitHub',
        'git reset --hard',
        'Không làm được gì, phải tạo repo mới',
      ],
      answer: 0,
      explain: '.gitignore chỉ ngăn file MỚI. Gỡ file đã theo dõi mà vẫn giữ trên ổ: git rm -r --cached <thư mục> rồi commit.',
    },
  ],

  'muc-6': [
    {
      q: 'Bạn sửa một asset 50 MB và push lại 10 lần. Điều này tiêu tốn gì của chủ repo?',
      options: [
        '500 MB băng thông, 0 lưu trữ',
        '0 băng thông, 500 MB lưu trữ (mỗi phiên bản được giữ)',
        '50 MB lưu trữ, 0 băng thông',
        'Không tốn gì cả',
      ],
      answer: 1,
      explain: 'Push chỉ tính vào LƯU TRỮ. Mỗi phiên bản asset được giữ vĩnh viễn → đây là lý do "hạn chế sửa asset lớn không cần thiết".',
    },
    {
      q: 'Băng thông LFS bị tiêu hao khi nào?',
      options: [
        'Khi push asset lên',
        'Khi bất kỳ ai (kể cả CI) clone/pull/checkout nội dung LFS về',
        'Khi tạo tag',
        'Khi viết commit message',
      ],
      answer: 1,
      explain: 'Băng thông tính vào chủ repo mỗi lần AI ĐÓ tải asset LFS về. Push chỉ tốn lưu trữ.',
    },
    {
      q: 'Vì sao File Locking (git lfs lock) là tính năng "cứu mạng" cho studio game?',
      options: [
        'Vì nó nén asset cho nhẹ',
        'Vì asset nhị phân không merge được — nếu hai người cùng sửa một .umap thì một người chắc chắn mất việc',
        'Vì nó tăng tốc độ push',
        'Vì nó tự động backup asset',
      ],
      answer: 1,
      explain: 'Lock để người khác thấy và không động vào file bạn đang sửa — ngăn xung đột asset ngay từ đầu.',
    },
  ],

  'muc-7': [
    {
      q: 'Đâu là commit message TỐT theo chuẩn tài liệu?',
      options: ['update', 'sửa bug', 'Add dash ability to player character', 'asdfgh'],
      answer: 2,
      explain: 'Dòng đầu ngắn, động từ mệnh lệnh tiếng Anh (Add/Fix/Refactor/Remove), mô tả VIỆC LÀM chứ không phải file nào.',
    },
    {
      q: 'Vì sao git diff KHÔNG hiển thị được khác biệt của asset .uasset?',
      options: [
        'Vì file quá lớn',
        'Vì Git không "đọc" được nội dung file nhị phân — đây là chuyện bình thường',
        'Vì bạn chưa git add',
        'Vì LFS bị lỗi',
      ],
      answer: 1,
      explain: 'Git không đọc được nhị phân → cần lock + quy ước riêng cho asset thay vì dựa vào diff.',
    },
  ],

  'muc-8': [
    {
      q: 'Quy tắc vàng của mô hình GitHub Flow trong tài liệu là gì?',
      options: [
        'Luôn commit trực tiếp lên main cho nhanh',
        'Không bao giờ commit trực tiếp lên main — mọi thay đổi đi qua một nhánh và một PR',
        'Chỉ dùng một nhánh duy nhất',
        'Rebase main mỗi ngày',
      ],
      answer: 1,
      explain: 'Tách nhánh ngắn hạn từ main → làm → PR → merge → xóa nhánh. main luôn build được.',
    },
    {
      q: 'Khi nào Git tạo một "merge commit" (3-way merge) thay vì fast-forward?',
      options: [
        'Khi nhánh đích không có commit riêng nào',
        'Khi cả hai nhánh đều có commit riêng so với nhau',
        'Luôn luôn tạo merge commit',
        'Chỉ khi dùng git rebase',
      ],
      answer: 1,
      explain: 'Cả hai nhánh có commit riêng → Git tạo merge commit hai cha. Nếu chỉ một bên tiến lên → fast-forward, lịch sử thẳng.',
    },
    {
      q: 'Khi merge PR, vì sao nên dùng "Squash and merge"?',
      options: [
        'Để giữ tất cả commit lẻ trên main',
        'Để gộp tất cả commit của nhánh thành MỘT, giữ lịch sử main sạch',
        'Để xóa nhánh tự động',
        'Để bỏ qua review',
      ],
      answer: 1,
      explain: 'Squash gộp cả nhánh thành một commit đại diện → lịch sử main gọn gàng, dễ đọc.',
    },
  ],

  'muc-9': [
    {
      q: 'Khác biệt cốt lõi giữa git push --force và git push --force-with-lease?',
      options: [
        'Không khác gì nhau',
        '--force-with-lease chỉ ghi đè nếu remote chưa có commit nào bạn chưa thấy → an toàn hơn hẳn',
        '--force nhanh hơn nên tốt hơn',
        '--force-with-lease chỉ dùng cho main',
      ],
      answer: 1,
      explain: '--force ghi đè vô điều kiện (có thể xóa commit đồng đội vừa push). --force-with-lease bị chặn đúng trong tình huống đó.',
    },
    {
      q: 'git reset --hard origin/main làm gì với các commit local chưa push?',
      options: [
        'Giữ nguyên chúng',
        'Đẩy chúng lên remote',
        'XÓA hết chúng và mọi thay đổi chưa commit — local giống hệt remote',
        'Chuyển chúng sang nhánh mới',
      ],
      answer: 2,
      explain: 'reset --hard xóa mọi thay đổi chưa commit và commit local chưa push. Muốn dọn file chưa track: git clean -nd rồi -fd.',
    },
    {
      q: 'Nguyên tắc bao trùm khi ghi đè/viết lại lịch sử là gì?',
      options: [
        'Chỉ ghi đè thứ thuộc về riêng bạn — bản local, hoặc nhánh cá nhân chưa ai làm cùng',
        'Ghi đè bất cứ nhánh nào cho nhanh',
        'Luôn force push lên main',
        'Không bao giờ được ghi đè bất cứ gì',
      ],
      answer: 0,
      explain: 'Không bao giờ force push lên main; branch protection nên chặn cứng. Chỉ ghi đè nhánh riêng chưa chia sẻ.',
    },
  ],

  'muc-10': [
    {
      q: 'Khi hai nhánh cùng sửa một asset nhị phân (.umap), Git xử lý thế nào?',
      options: [
        'Tự động trộn hai phiên bản',
        'KHÔNG thể trộn — buộc phải chọn giữ MỘT, người còn lại phải làm lại',
        'Giữ cả hai thành hai file',
        'Báo lỗi và hủy repo',
      ],
      answer: 1,
      explain: 'Đây chính là lý do File Locking và quy ước phân chia công việc tồn tại — phòng bệnh hơn chữa bệnh.',
    },
    {
      q: 'Trong khi merge, git checkout --ours <file> giữ phiên bản nào?',
      options: [
        'Phiên bản từ nhánh được merge vào',
        'Phiên bản của nhánh hiện tại (của bạn)',
        'Cả hai phiên bản',
        'Xóa cả hai',
      ],
      answer: 1,
      explain: '--ours = nhánh hiện tại, --theirs = nhánh được merge vào. Lưu ý: khi REBASE hai cờ này đảo vai trò!',
    },
  ],

  'muc-11': [
    {
      q: 'Bạn lỡ git reset --hard làm mất 2 commit chưa push. Cách cứu?',
      options: [
        'Không cứu được, phải làm lại',
        'git reflog để tìm hash trạng thái trước khi reset, rồi git reset --hard <hash-đó>',
        'git pull origin main',
        'Tạo repo mới',
      ],
      answer: 1,
      explain: 'reflog ghi lại mọi lần HEAD di chuyển (giữ ~90 ngày). Một commit đã tạo gần như không bao giờ mất thật.',
    },
    {
      q: 'Để hoàn tác một commit ĐÃ push lên nhánh chung một cách AN TOÀN, nên dùng?',
      options: [
        'git reset --hard <hash>',
        'git push --force',
        'git revert <hash> — tạo commit mới đảo ngược, giữ nguyên lịch sử',
        'git clean -fd',
      ],
      answer: 2,
      explain: 'revert an toàn cho nhánh chung vì không viết lại lịch sử. reset --hard chỉ dùng cho nhánh riêng chưa chia sẻ.',
    },
  ],

  'muc-12': [
    {
      q: 'Sau khi tạo tag git tag -a v0.4.0-demo, bạn git push origin main. Tag đã lên GitHub chưa?',
      options: [
        'Rồi, tag tự lên cùng code',
        'Chưa — tag KHÔNG tự lên khi push code, phải push riêng: git push origin v0.4.0-demo (hoặc --tags)',
        'Chưa, tag không bao giờ lên được GitHub',
        'Rồi, nếu là annotated tag',
      ],
      answer: 1,
      explain: 'Tag phải push riêng. Đây là lỗi kinh điển khiến Release "không thấy tag đâu".',
    },
    {
      q: 'Ưu điểm cốt lõi của tag so với nhánh khi đánh dấu bản build?',
      options: [
        'Tag chạy nhanh hơn',
        'Tag là nhãn BẤT BIẾN đứng yên mãi ở đúng commit, còn nhánh thì trôi theo commit mới',
        'Tag tự đóng gói build',
        'Tag không cần commit',
      ],
      answer: 1,
      explain: 'Nhánh trôi theo commit mới; tag đứng yên → hoàn hảo để "bản demo này là code nào?" trả lời trong 5 giây.',
    },
  ],

  'muc-13': [
    {
      q: 'Push bị từ chối: "rejected, non-fast-forward". Nguyên nhân và cách xử lý?',
      options: [
        'Token hết hạn — tạo token mới',
        'Remote có commit mới mà bạn chưa có — chạy git pull, giải quyết conflict nếu có, rồi push lại',
        'LFS hết quota — chờ sang tháng',
        'Nhánh bị lock — liên hệ admin',
      ],
      answer: 1,
      explain: 'non-fast-forward = remote đã đi trước. Pull về, xử lý conflict, rồi push lại.',
    },
    {
      q: 'Clone xong, asset tải về chỉ là vài dòng text (con trỏ LFS). Cách xử lý?',
      options: [
        'git lfs install rồi git lfs pull',
        'git reset --hard',
        'Xóa repo và clone lại bằng ZIP',
        'git commit --amend',
      ],
      answer: 0,
      explain: 'Triệu chứng chưa cài/khởi tạo LFS. Chạy git lfs install rồi git lfs pull là xong.',
    },
    {
      q: 'Asset trong dự án bỗng ở trạng thái read-only. Đây là?',
      options: [
        'Lỗi ổ cứng',
        'Tính năng: file được đánh lockable, LFS khóa mềm để nhắc bạn git lfs lock trước khi sửa',
        'Virus',
        'Repo bị hỏng',
      ],
      answer: 1,
      explain: 'Là TÍNH NĂNG, không phải lỗi. Lock file để được quyền ghi rồi sửa.',
    },
  ],
};
