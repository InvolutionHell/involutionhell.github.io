## Git 提交 Guide
#### 1. 将本项目直接fork到自己的账号下，这样就可以直接在自己的账号下进行修改和提交。
![fork1](./fork1.jpg)
![fork2](./fork2.png)

*注意取消勾选仅克隆当前分支*

#### 2. 克隆项目
```
git clone https://github.com/你自己的仓库名/involutionhell.github.io.git
```
修改为自己fork的仓库，改为你的https仓库的git地址

#### 3. 创建自己的分支
列出现有分支
```
git branch -a  #用于列出当前Git仓库中所有的分支,包括本地分支和远程分支。
```
![branch-all](./branch-all.png)

##### 3.1  创建功能分支的约定命名
```
git checkout -b feat/your-feature 

# 它的作用是创建一个新的分支并立即切换到该分支上。

具体来说，这个命令相当于同时执行了两个操作：
git branch feat/your-feature - 创建名为 feat/your-feature 的新分支
git checkout feat/your-feature - 切换到这个新创建的分支

其中 feat/your-feature 是分支名称，通常遵循约定式命名：

feat/ 前缀表示这是一个功能（feature）分支
后面的 your-feature 通常是对功能的简要描述
```
##### 3.2  创建文档分支的约定命名
```
git checkout -b doc_raven   # 自定义一个新的分支
#git checkout -b doc_id 分支名字改为你的uid分支名称
```
#### 4. 提交更改分支
```
git add .
根据你的变动情况
git commit -m "add xxx" # 添加信息记录
or
git commit -m "edit xxx" # 修改信息记录
or
git commit -m "delete xxx" #删除信息记录
```

#### 5. 推送分支到远程仓库
```git push origin doc_raven
```