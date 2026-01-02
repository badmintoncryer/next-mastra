# Next Mastra CDK デプロイガイド

## 概要

このCDKスタックは、Next.js Mastraアプリケーションを以下の構成でAWSにデプロイします：

- **CloudFront Distribution**: CDN + IP制限
- **Lambda Function**: Docker imageでNext.jsアプリを実行
- **Lambda Web Adapter**: Next.jsをLambdaで動作させる
- **Lambda Function URL**: CloudFrontのオリジン（IAM認証）
- **Origin Access Control (OAC)**: Lambda Function URLを保護
- **ECR Repository**: Dockerイメージの保存

## 前提条件

1. AWS CLIの設定が完了していること
   ```bash
   aws configure
   ```

2. Node.js 18以上がインストールされていること

3. Dockerがインストールされ、起動していること

## セットアップ

### 1. CDK依存関係のインストール

```bash
cd cdk
npm install
```

### 2. CDK Bootstrap（初回のみ）

```bash
npm run cdk bootstrap
```

## デプロイ手順

### ステップ1: Dockerイメージのビルドとプッシュ

まず、ECRリポジトリを作成するためにCDKスタックをデプロイします（初回のみ）：

```bash
cd cdk
npm run cdk deploy
```

デプロイ後、出力される`RepositoryUri`を確認します。

次に、Dockerイメージをビルドしてプッシュします：

```bash
# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com

# webappディレクトリでイメージをビルド
cd ../webapp
docker build -t next-mastra .

# イメージにタグを付ける
docker tag next-mastra:latest <REPOSITORY_URI>:latest

# ECRにプッシュ
docker push <REPOSITORY_URI>:latest
```

### ステップ2: IP制限の設定（オプション）

特定のIPアドレスからのみアクセスを許可する場合：

**方法1: 環境変数で指定**
```bash
export ALLOWED_IPS="1.2.3.4,5.6.7.8/32"
npm run cdk deploy
```

**方法2: CDKコンテキストで指定**
```bash
npm run cdk deploy -c allowedIps="1.2.3.4,5.6.7.8/32"
```

IP制限を設定しない場合は、すべてのIPからアクセス可能になります。

### ステップ3: スタックの再デプロイ

Dockerイメージをプッシュした後、Lambdaが新しいイメージを使用するように再デプロイします：

```bash
cd cdk
npm run cdk deploy
```

## デプロイ後の確認

デプロイが完了すると、以下の出力が表示されます：

- **RepositoryUri**: ECRリポジトリのURI
- **FunctionUrl**: Lambda Function URL（直接アクセス不可）
- **DistributionUrl**: CloudFront Distribution URL（このURLでアクセス）

### アクセステスト

```bash
# CloudFront経由でアクセス（成功するはず）
curl https://<DISTRIBUTION_DOMAIN>/

# Lambda Function URLに直接アクセス（403エラーになるはず）
curl https://<FUNCTION_URL>/
```

## 環境変数の追加

OpenAI APIキーなどの機密情報を追加する場合：

### 方法1: AWS Systems Manager Parameter Storeを使用

```bash
aws ssm put-parameter \
  --name /next-mastra/openai-api-key \
  --value "sk-xxxxx" \
  --type SecureString
```

その後、`cdk-stack.ts`でLambda環境変数に追加：

```typescript
environment: {
  PORT: '8080',
  AWS_LWA_INVOKE_MODE: 'response_stream',
  OPENAI_API_KEY: ssm.StringParameter.valueFromLookup(this, '/next-mastra/openai-api-key'),
},
```

### 方法2: Lambda環境変数に直接設定（非推奨）

`cdk-stack.ts`を編集：

```typescript
environment: {
  PORT: '8080',
  AWS_LWA_INVOKE_MODE: 'response_stream',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
},
```

## トラブルシューティング

### Lambda Function URLに直接アクセスできない

これは正常な動作です。OACにより、CloudFrontからのIAM認証済みリクエストのみが許可されます。

### CloudFrontでタイムアウトエラー

1. Lambdaのタイムアウト設定を確認（現在30秒）
2. CloudWatchログでLambdaのエラーを確認

```bash
aws logs tail /aws/lambda/NextMastraStack-NextMastraFunction --follow
```

### Dockerイメージのプッシュに失敗

1. ECRへのログインを確認
2. リポジトリが存在することを確認
3. IAM権限を確認（`ecr:PutImage`など）

### IP制限が機能しない

1. CloudFront Functionが正しくデプロイされているか確認
2. 許可IPリストの形式を確認（カンマ区切り）
3. CIDR表記を使用する場合は`/32`を付ける

## スタックの削除

```bash
cd cdk
npm run cdk destroy
```

**注意**: ECRリポジトリ内のイメージは自動的に削除されます（`emptyOnDelete: true`設定済み）。

## 更新デプロイ

アプリケーションを更新する場合：

```bash
# 1. Dockerイメージを再ビルド
cd webapp
docker build -t next-mastra .
docker tag next-mastra:latest <REPOSITORY_URI>:latest
docker push <REPOSITORY_URI>:latest

# 2. Lambda関数を更新（イメージの変更を検知）
cd ../cdk
npm run cdk deploy
```

## コスト見積もり

主なコスト要素：
- **Lambda**: 実行時間とメモリ使用量に基づく
- **CloudFront**: データ転送量とリクエスト数
- **ECR**: ストレージ（最小限）

無料枠を超えた場合の概算：
- Lambda: $0.0000166667/GB-秒
- CloudFront: $0.114/GB（データ転送、ap-northeast-1）
- ECR: $0.10/GB-月

## 参考リンク

- [Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter)
- [CloudFront OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html)
- [CDK Lambda Docker](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.DockerImageFunction.html)
