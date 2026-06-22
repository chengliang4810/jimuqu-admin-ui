/**
 * 项目自定义规则覆盖。
 *
 * 放置项目级别的规则开关/覆盖,避免散落在各预设配置中。
 */
export async function custom() {
  return [
    {
      rules: {
        'no-useless-assignment': 'off',
      },
    },
  ];
}
