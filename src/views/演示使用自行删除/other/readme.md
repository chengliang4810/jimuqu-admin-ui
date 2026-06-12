## SM4 key长度

SM4只支持16长度的字符串作为key, 需要在前端后端都更改为16长度

前端位置: `apps/web-antd/src/api/request.ts`

```js
// sm4这里改为randomStr(16)
const key = randomStr(16);
```

后端位置: `src/main/java/org/dromara/common/encrypt/filter/EncryptResponseBodyWrapper.java`

```java
public String getEncryptContent(HttpServletResponse servletResponse, String publicKey,    String headerFlag) throws IOException {
    // 生成秘钥
    String aesPassword = RandomUtil.randomString(16);
}
```

## 可能需要导入依赖

详见hutool文档 https://doc.hutool.cn/pages/SmUtil/#%E5%BC%95%E5%85%A5bouncy-castle%E4%BE%9D%E8%B5%96

```xml
<dependency>
  <groupId>org.bouncycastle</groupId>
  <artifactId>bcpkix-jdk18on</artifactId>
  <version>1.78.1</version>
</dependency>
```

## 前端怎么修改为SM4SM2

文件位置: `apps/web-antd/src/api/request.ts`

```ts
const asymmetricEncryption: BaseAsymmetricEncryption = new Sm2Encryption({
  publicKey: rsaPublicKey,
  privateKey: rsaPrivateKey,
});

/**
 * 对称加密的实现 AES/SM4
 */
const symmetricEncryption: BaseSymmetricEncryption = new Sm4Encryption();
```

修改对应的实现就行

## 后端加密必须为hex字符串

位置`ruoyi-common/ruoyi-common-encrypt/src/main/java/org/dromara/common/encrypt/filter/EncryptResponseBodyWrapper.java`

使用SM相关修改为`xxxxHex`方法而非`base64`!!!

```java
EncryptUtils.encryptBySm2Hex();
EncryptUtils.encryptBySm4Hex();
```
